import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { requireAdmin, isResponse } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { logger } from "@/lib/logger";
import { corsHeaders } from "@/lib/cors";
import { notifyOrderEvent } from "@/lib/notify";

// Only manual payment types can be confirmed this way — PREPAID goes through Razorpay webhook.
const CONFIRMABLE_PAYMENT_TYPES = new Set(["COD", "BANK_TRANSFER"]);

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

  try {
    const { orderId } = await params;
    if (!orderId) return apiError("BAD_REQUEST", "orderId required", headers);

    const order = await prismadb.order.findUnique({
      where: { id: orderId },
      select: { id: true, orderId: true, isPaid: true, status: true, paymentType: true },
    });

    if (!order) return apiError("NOT_FOUND", "Order not found", headers);

    if (!CONFIRMABLE_PAYMENT_TYPES.has(order.paymentType)) {
      return apiError(
        "CONFLICT",
        `Payment confirmation is only for COD/BANK_TRANSFER orders (type: ${order.paymentType})`,
        headers
      );
    }

    if (order.isPaid) {
      return apiError("CONFLICT", "Order is already marked as paid", headers);
    }

    if (order.status === "CANCELLED" || order.status === "REFUNDED") {
      return apiError("CONFLICT", `Cannot confirm payment for ${order.status} order`, headers);
    }

    const updated = await prismadb.order.update({
      where: { id: orderId },
      data: { isPaid: true, paidAt: new Date() },
    });

    notifyOrderEvent(order.orderId, "ORDER_CONFIRMED").catch((e) =>
      logger.error("[notify ORDER_CONFIRMED]", e, { orderId: order.id })
    );

    return NextResponse.json({ status: "ok", orderId: order.id, isPaid: updated.isPaid }, { headers });
  } catch (error) {
    logger.error("[CONFIRM_PAYMENT_POST]", error);
    return apiError("INTERNAL", "Failed to confirm payment", headers);
  }
}
