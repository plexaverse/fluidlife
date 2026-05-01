import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { requireUser, isResponse } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { logger } from "@/lib/logger";
import { corsHeaders } from "@/lib/cors";
import { notifyOrderEvent } from "@/lib/notify";

const CANCELLABLE = new Set(["PAYMENT_PENDING", "ORDERED"]);

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const headers = corsHeaders(req);
  const session = await requireUser(req);
  if (isResponse(session)) return session;

  try {
    const { orderId } = await params;
    if (!orderId) return apiError("BAD_REQUEST", "orderId required", headers);

    const result = await prismadb.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { orderItems: true },
      });
      if (!order) return { kind: "not_found" as const };
      if (order.userId !== session.userId && session.role !== "ADMIN") {
        return { kind: "forbidden" as const };
      }
      if (order.deletedAt) return { kind: "not_found" as const };
      if (!CANCELLABLE.has(order.status)) {
        return { kind: "conflict" as const, status: order.status };
      }

      // Restore stock for each item.
      await Promise.all(
        order.orderItems.map((item) =>
          tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          })
        )
      );

      // Decrement coupon usage if one was applied.
      if (order.couponId) {
        await tx.coupon.updateMany({
          where: { id: order.couponId, usedCount: { gt: 0 } },
          data: { usedCount: { decrement: 1 } },
        });
      }

      // Release distributor credit if the order consumed it.
      if (
        (order.paymentType === "COD" || order.paymentType === "BANK_TRANSFER") &&
        order.amount.gt(0)
      ) {
        await tx.user.update({
          where: { id: order.userId },
          data: { creditUsed: { decrement: order.amount } },
        });
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });
      return { kind: "ok" as const, order: updated };
    });

    if (result.kind === "not_found") return apiError("NOT_FOUND", "Order not found", headers);
    if (result.kind === "forbidden") return apiError("FORBIDDEN", "Not your order", headers);
    if (result.kind === "conflict") return apiError("CONFLICT", `Cannot cancel order in state ${result.status}`, headers);

    notifyOrderEvent(result.order.orderId, "ORDER_CANCELLED").catch((e) =>
      logger.error("[notify ORDER_CANCELLED]", e, { orderId: result.order.id })
    );

    return NextResponse.json(result.order, { headers });
  } catch (error) {
    logger.error("[ORDER_CANCEL]", error);
    return apiError("INTERNAL", "Failed to cancel order", headers);
  }
}
