import { NextResponse } from "next/server";
import crypto from "crypto";
import { Prisma } from "@prisma/client";
import prismadb from "@/lib/prismadb";
import { requireUser, isResponse } from "@/lib/auth";
import { apiError, apiValidationError } from "@/lib/api-error";
import { logger } from "@/lib/logger";
import { corsHeaders } from "@/lib/cors";
import { safeJson } from "@/lib/safe-json";
import { checkoutSchema } from "@/lib/schemas";
import { computeTaxLine, summarizeTax, isInterState, type TaxLine } from "@/lib/gst";
import { env } from "@/lib/env";

const ZERO = new Prisma.Decimal(0);
const DELIVERY_GST_RATE = new Prisma.Decimal(18);

function generateOrderId(): string {
  return `ORD-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function POST(req: Request) {
  const headers = corsHeaders(req);
  const session = await requireUser(req);
  if (isResponse(session)) return session;

  try {
    const r = await safeJson(req, { headers });
    if (!r.ok) return r.response;
    const parsed = checkoutSchema.safeParse(r.data);
    if (!parsed.success) return apiValidationError(parsed.error, headers);
    const {
      addressId,
      paymentType,
      couponCode,
      idempotencyKey,
      items: rawItems,
      deliveryAmount: clientDeliveryAmount,
    } = parsed.data;

    // Coalesce duplicate productIds.
    const merged = new Map<string, number>();
    for (const it of rawItems) merged.set(it.productId, (merged.get(it.productId) ?? 0) + it.quantity);
    const items = Array.from(merged, ([productId, quantity]) => ({ productId, quantity }));

    if (idempotencyKey) {
      const existing = await prismadb.order.findUnique({
        where: { idempotencyKey },
        include: { orderItems: true },
      });
      if (existing) {
        if (existing.userId !== session.userId) {
          return apiError("CONFLICT", "Idempotency key already used", headers);
        }
        return NextResponse.json(existing, { headers });
      }
    }

    const useB2bPricing = session.role === "DISTRIBUTOR";
    const onCredit = useB2bPricing && (paymentType === "COD" || paymentType === "BANK_TRANSFER");
    const productIds = items.map((i) => i.productId);

    const result = await prismadb.$transaction(async (tx) => {
      // ─── 1. User: distributor approval / credit ─────────────────────────
      const user = await tx.user.findUnique({
        where: { id: session.userId },
        select: { role: true, isApproved: true, creditLimit: true, creditUsed: true },
      });
      if (!user) return { kind: "user_missing" as const };
      if (user.role === "DISTRIBUTOR" && !user.isApproved) {
        return { kind: "unapproved" as const };
      }

      // ─── 2. Address (ownership + state for GST) ─────────────────────────
      const address = await tx.address.findUnique({
        where: { id: addressId },
        select: { userId: true, state: true },
      });
      if (!address || address.userId !== session.userId) {
        return { kind: "address" as const };
      }
      const interState = isInterState(env.SELLER.state, address.state);

      // ─── 3. Products + per-line gross ──────────────────────────────────
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, isArchived: false },
        select: {
          id: true,
          price: true,
          b2bPrice: true,
          moq: true,
          stock: true,
          gstRate: true,
          hsnCode: true,
          deliveryPrice: true,
        },
      });
      const byId = new Map(products.map((p) => [p.id, p]));

      let subtotalGross = ZERO;
      const lines: { productId: string; qty: number; unit: Prisma.Decimal; gross: Prisma.Decimal; gstRate: Prisma.Decimal; hsn: string | null; deliveryPrice: Prisma.Decimal }[] = [];

      for (const it of items) {
        const p = byId.get(it.productId);
        if (!p) return { kind: "product_missing" as const, productId: it.productId };
        if (useB2bPricing && it.quantity < p.moq) {
          return { kind: "moq" as const, productId: it.productId, moq: p.moq };
        }
        const unit = useB2bPricing && p.b2bPrice ? new Prisma.Decimal(p.b2bPrice) : new Prisma.Decimal(p.price);
        const gross = unit.mul(it.quantity);
        subtotalGross = subtotalGross.plus(gross);
        lines.push({
          productId: it.productId,
          qty: it.quantity,
          unit,
          gross,
          gstRate: new Prisma.Decimal(p.gstRate),
          hsn: p.hsnCode,
          deliveryPrice: new Prisma.Decimal(p.deliveryPrice),
        });
      }

      // ─── 4. Atomic stock decrement (parallel) ───────────────────────────
      const decrements = await Promise.all(
        items.map((it) =>
          tx.product
            .updateMany({
              where: { id: it.productId, stock: { gte: it.quantity } },
              data: { stock: { decrement: it.quantity } },
            })
            .then((res) => ({ productId: it.productId, count: res.count }))
        )
      );
      const failed = decrements.find((d) => d.count !== 1);
      if (failed) return { kind: "stock" as const, productId: failed.productId };

      // ─── 5. Coupon (atomic usage increment) ─────────────────────────────
      let discount = ZERO;
      let couponId: string | null = null;
      if (couponCode) {
        const coupon = await tx.coupon.findUnique({ where: { code: couponCode } });
        if (!coupon) return { kind: "coupon" as const, message: "Coupon not found" };
        if (!coupon.isActive) return { kind: "coupon" as const, message: "Coupon inactive" };
        const now = new Date();
        if (coupon.validFrom && now < coupon.validFrom) return { kind: "coupon" as const, message: "Coupon not yet active" };
        if (coupon.validUntil && now > coupon.validUntil) return { kind: "coupon" as const, message: "Coupon expired" };
        if (coupon.minOrderAmount && subtotalGross.lt(coupon.minOrderAmount)) {
          return { kind: "coupon" as const, message: `Minimum order ₹${coupon.minOrderAmount} required` };
        }

        if (coupon.discountType === "PERCENTAGE") {
          discount = subtotalGross.mul(coupon.discountValue).div(100);
          if (coupon.maxDiscount && discount.gt(coupon.maxDiscount)) {
            discount = new Prisma.Decimal(coupon.maxDiscount);
          }
        } else {
          discount = new Prisma.Decimal(coupon.discountValue);
        }
        if (discount.gt(subtotalGross)) discount = subtotalGross;

        if (coupon.usageLimit !== null) {
          const used = await tx.coupon.updateMany({
            where: { id: coupon.id, usedCount: { lt: coupon.usageLimit } },
            data: { usedCount: { increment: 1 } },
          });
          if (used.count !== 1) return { kind: "coupon" as const, message: "Coupon usage limit reached" };
        } else {
          await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
        }
        couponId = coupon.id;
      }

      // ─── 6. Delivery (client quote, product fallback, free-shipping threshold) ─
      const fallbackDelivery = lines.reduce(
        (max, l) => (l.deliveryPrice.gt(max) ? l.deliveryPrice : max),
        ZERO
      );
      let delivery =
        clientDeliveryAmount !== undefined
          ? new Prisma.Decimal(clientDeliveryAmount)
          : fallbackDelivery;
      const threshold = new Prisma.Decimal(env.FREE_SHIPPING_THRESHOLD);
      const grossAfterDiscount = subtotalGross.minus(discount);
      if (threshold.gt(0) && grossAfterDiscount.gte(threshold)) {
        delivery = ZERO;
      }

      // ─── 7. Per-line GST (proportional discount allocation) ────────────
      const taxLines: TaxLine[] = [];
      for (const l of lines) {
        const lineDiscount = subtotalGross.gt(0)
          ? discount.mul(l.gross).div(subtotalGross)
          : ZERO;
        const discountedGross = l.gross.minus(lineDiscount);
        taxLines.push(
          computeTaxLine({
            productId: l.productId,
            hsnCode: l.hsn,
            rate: l.gstRate,
            grossAmount: discountedGross,
            interState,
          })
        );
      }
      // Delivery has its own GST line if non-zero.
      if (delivery.gt(0)) {
        taxLines.push(
          computeTaxLine({
            productId: "__delivery__",
            hsnCode: null,
            rate: DELIVERY_GST_RATE,
            grossAmount: delivery,
            interState,
          })
        );
      }
      const taxSummary = summarizeTax(taxLines);
      const taxBreakup = {
        interState,
        sellerState: env.SELLER.state ?? null,
        buyerState: address.state,
        lines: taxLines.map((t) => ({
          productId: t.productId,
          hsnCode: t.hsnCode,
          rate: t.rate.toString(),
          taxable: t.taxable.toFixed(2),
          gst: t.gst.toFixed(2),
          cgst: t.cgst.toFixed(2),
          sgst: t.sgst.toFixed(2),
          igst: t.igst.toFixed(2),
        })),
        totals: {
          taxable: taxSummary.taxable.toFixed(2),
          gst: taxSummary.gst.toFixed(2),
          cgst: taxSummary.cgst.toFixed(2),
          sgst: taxSummary.sgst.toFixed(2),
          igst: taxSummary.igst.toFixed(2),
        },
      };

      const amount = grossAfterDiscount.plus(delivery);

      // ─── 8. Distributor credit limit (COD / BANK_TRANSFER) ─────────────
      if (onCredit && user.creditLimit !== null) {
        const newUsed = new Prisma.Decimal(user.creditUsed).plus(amount);
        if (newUsed.gt(user.creditLimit)) {
          return { kind: "credit" as const };
        }
        await tx.user.update({
          where: { id: session.userId },
          data: { creditUsed: { increment: amount } },
        });
      }

      // ─── 9. Order ───────────────────────────────────────────────────────
      const initialStatus = paymentType === "PREPAID" ? "PAYMENT_PENDING" : "ORDERED";
      const paymentExpiresAt =
        paymentType === "PREPAID"
          ? new Date(Date.now() + env.PAYMENT_EXPIRY_MINUTES * 60_000)
          : null;

      const order = await tx.order.create({
        data: {
          orderId: generateOrderId(),
          idempotencyKey,
          isPaid: false,
          paymentType,
          status: initialStatus,
          subtotalAmount: subtotalGross,
          discountAmount: discount,
          taxAmount: taxSummary.gst,
          deliveryAmount: delivery,
          taxBreakup: taxBreakup as any,
          amount,
          paymentExpiresAt,
          addressId,
          userId: session.userId,
          ...(couponId && { couponId }),
          orderItems: {
            create: lines.map((l) => ({
              productId: l.productId,
              quantity: l.qty,
              priceAtPurchase: l.unit,
            })),
          },
        },
        include: { orderItems: true },
      });
      return { kind: "ok" as const, order };
    });

    if (result.kind === "user_missing") return apiError("UNAUTHORIZED", "User no longer exists", headers);
    if (result.kind === "unapproved")
      return apiError("FORBIDDEN", "Distributor account pending approval", headers);
    if (result.kind === "address") return apiError("FORBIDDEN", "Address does not belong to you", headers);
    if (result.kind === "product_missing")
      return apiError("BAD_REQUEST", `Product ${result.productId} unavailable`, headers);
    if (result.kind === "moq")
      return apiError("BAD_REQUEST", `Minimum order quantity for ${result.productId} is ${result.moq}`, headers);
    if (result.kind === "stock")
      return apiError("CONFLICT", `Insufficient stock for ${result.productId}`, headers);
    if (result.kind === "coupon") return apiError("BAD_REQUEST", result.message, headers);
    if (result.kind === "credit") return apiError("CONFLICT", "Credit limit exceeded", headers);

    return NextResponse.json(result.order, { headers });
  } catch (error: any) {
    if (error?.code === "P2002") {
      try {
        const body = await req.clone().json().catch(() => null);
        const key = body?.idempotencyKey;
        if (typeof key === "string") {
          const existing = await prismadb.order.findUnique({ where: { idempotencyKey: key }, include: { orderItems: true } });
          if (existing && existing.userId === session.userId) {
            return NextResponse.json(existing, { headers });
          }
        }
      } catch {}
      return apiError("CONFLICT", "Duplicate order", headers);
    }
    logger.error("[CHECKOUT_POST]", error);
    return apiError("INTERNAL", "Failed to create order", headers);
  }
}
