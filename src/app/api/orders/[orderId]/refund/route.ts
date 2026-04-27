import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prismadb from "@/lib/prismadb";
import { requireAdmin, isResponse } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { logger } from "@/lib/logger";
import { corsHeaders } from "@/lib/cors";
import { safeJson } from "@/lib/safe-json";
import { createRefund } from "@/lib/razorpay";
import { notifyOrderEvent } from "@/lib/notify";
import { env } from "@/lib/env";

const REFUNDABLE = new Set(["ORDERED", "SHIPPED", "DELIVERED"]);

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const headers = corsHeaders(req);
  const auth = await requireAdmin();
  if (isResponse(auth)) return auth;

  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    return apiError("INTERNAL", "Razorpay refund credentials not configured", headers);
  }

  try {
    const { orderId } = await params;
    if (!orderId) return apiError("BAD_REQUEST", "orderId required", headers);

    const r = await safeJson(req, { headers, maxBytes: 4096 });
    if (!r.ok) return r.response;
    const body = r.data as any;
    const requestedAmount = body?.amount !== undefined ? Number(body.amount) : undefined;
    const reason = typeof body?.reason === "string" ? body.reason.slice(0, 200) : undefined;

    const order = await prismadb.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true },
    });
    if (!order) return apiError("NOT_FOUND", "Order not found", headers);
    if (!REFUNDABLE.has(order.status)) {
      return apiError("CONFLICT", `Cannot refund order in state ${order.status}`, headers);
    }
    if (!order.isPaid) return apiError("CONFLICT", "Order has not been paid", headers);
    if (!order.razorpayPaymentId) {
      return apiError("CONFLICT", "Order has no associated Razorpay payment", headers);
    }
    if (order.refundedAt) return apiError("CONFLICT", "Order has already been refunded", headers);

    const orderAmount = new Prisma.Decimal(order.amount);
    let refundAmount: Prisma.Decimal;
    if (requestedAmount !== undefined) {
      if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
        return apiError("BAD_REQUEST", "amount must be > 0", headers);
      }
      refundAmount = new Prisma.Decimal(requestedAmount);
      if (refundAmount.gt(orderAmount)) {
        return apiError("BAD_REQUEST", "amount exceeds order total", headers);
      }
    } else {
      refundAmount = orderAmount;
    }

    // Razorpay takes paise (integer).
    const amountPaise = Math.round(refundAmount.mul(100).toNumber());

    const refund = await createRefund({
      paymentId: order.razorpayPaymentId,
      amount: refundAmount.eq(orderAmount) ? undefined : amountPaise,
      notes: { orderId: order.orderId, ...(reason && { reason }) },
    });

    // Persist + restore stock + decrement coupon usage atomically.
    await prismadb.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "REFUNDED",
          refundedAt: new Date(),
          refundAmount,
          refundId: refund.id,
        },
      });
      await Promise.all(
        order.orderItems.map((it) =>
          tx.product.update({
            where: { id: it.productId },
            data: { stock: { increment: it.quantity } },
          })
        )
      );
      if (order.couponId) {
        await tx.coupon.updateMany({
          where: { id: order.couponId, usedCount: { gt: 0 } },
          data: { usedCount: { decrement: 1 } },
        });
      }
      // Release distributor credit if applicable.
      if (
        (order.paymentType === "COD" || order.paymentType === "BANK_TRANSFER") &&
        refundAmount.gt(0)
      ) {
        await tx.user.update({
          where: { id: order.userId },
          data: { creditUsed: { decrement: refundAmount } },
        });
      }
    });

    notifyOrderEvent(order.orderId, "ORDER_REFUNDED").catch((e) =>
      logger.error("[notify ORDER_REFUNDED]", e, { orderId: order.id })
    );

    return NextResponse.json(
      {
        refundId: refund.id,
        amount: refundAmount.toFixed(2),
        status: refund.status,
      },
      { headers }
    );
  } catch (error: any) {
    logger.error("[REFUND_POST]", error);
    if (error?.status >= 400 && error?.status < 500) {
      return apiError("BAD_REQUEST", `Razorpay rejected refund: ${error.message}`, headers);
    }
    return apiError("INTERNAL", "Failed to issue refund", headers);
  }
}
