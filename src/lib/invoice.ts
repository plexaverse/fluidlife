import "server-only";
import { Prisma } from "@prisma/client";
import prismadb from "./prismadb";
import { env } from "./env";

function bucket(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/**
 * Atomically allocate the next sequence number for the given month bucket.
 * Returns a GST-compliant invoice number like "INV-2026-04-0001".
 *
 * Idempotency: callers should use this only on orders without an existing
 * invoiceNumber. The Order.invoiceNumber @unique guards against double-issue
 * (a P2002 means another request already issued one — re-fetch instead).
 */
export async function allocateInvoiceNumber(now: Date = new Date()): Promise<string> {
  const key = bucket(now);
  // Atomic upsert + increment.
  const counter = await prismadb.invoiceCounter.upsert({
    where: { bucket: key },
    create: { bucket: key, next: 2 },
    update: { next: { increment: 1 } },
    select: { next: true },
  });
  // counter.next is the value AFTER the increment, so the issued number is next-1.
  // For the "create" branch we wrote `next: 2` and used 1 — same convention.
  const issued = counter.next - 1;
  return `INV-${key}-${String(issued).padStart(4, "0")}`;
}

/**
 * Issue an invoice number on an order if it doesn't have one yet.
 * Safe to call multiple times: returns the existing number after the first call.
 * Caller must ensure the order is in a state where invoicing is appropriate
 * (i.e. paid / shipped / delivered).
 */
export async function ensureInvoiceNumber(orderId: string): Promise<string> {
  const existing = await prismadb.order.findUnique({
    where: { id: orderId },
    select: { invoiceNumber: true },
  });
  if (!existing) throw new Error(`Order ${orderId} not found`);
  if (existing.invoiceNumber) return existing.invoiceNumber;

  const number = await allocateInvoiceNumber();
  try {
    await prismadb.order.update({
      where: { id: orderId, invoiceNumber: null },
      data: { invoiceNumber: number },
    });
    return number;
  } catch (e: any) {
    // Race: another request issued one first. Re-read.
    if (e?.code === "P2025" || e?.code === "P2002") {
      const o = await prismadb.order.findUnique({
        where: { id: orderId },
        select: { invoiceNumber: true },
      });
      if (o?.invoiceNumber) return o.invoiceNumber;
    }
    throw e;
  }
}

export async function buildInvoicePayload(orderId: string) {
  const order = await prismadb.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: {
        include: {
          product: { select: { id: true, name: true, hsnCode: true, gstRate: true } },
        },
      },
      address: true,
      user: { select: { id: true, name: true, email: true, phone: true, gstNumber: true, companyName: true } },
      coupon: { select: { code: true } },
    },
  });
  if (!order) return null;

  return {
    invoice: {
      number: order.invoiceNumber,
      issuedAt: order.paidAt ?? order.createdAt,
      orderId: order.orderId,
      paymentType: order.paymentType,
    },
    seller: env.SELLER,
    buyer: {
      name: order.user.name,
      email: order.user.email,
      phone: order.user.phone,
      companyName: order.user.companyName,
      gstNumber: order.user.gstNumber,
      address: order.address,
    },
    items: order.orderItems.map((it) => ({
      productId: it.productId,
      name: it.product.name,
      hsnCode: it.product.hsnCode,
      gstRate: String(it.product.gstRate),
      quantity: it.quantity,
      unitPrice: String(it.priceAtPurchase),
      lineTotal: new Prisma.Decimal(it.priceAtPurchase).mul(it.quantity).toFixed(2),
    })),
    totals: {
      subtotal: String(order.subtotalAmount),
      discount: String(order.discountAmount),
      delivery: String(order.deliveryAmount),
      tax: String(order.taxAmount),
      grandTotal: String(order.amount),
      coupon: order.coupon?.code ?? null,
    },
    taxBreakup: order.taxBreakup,
  };
}
