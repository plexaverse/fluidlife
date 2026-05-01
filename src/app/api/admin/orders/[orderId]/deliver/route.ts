import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { requireAdmin, isResponse } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { logger } from "@/lib/logger";
import { corsHeaders } from "@/lib/cors";
import { notifyOrderEvent } from "@/lib/notify";

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
      select: { id: true, orderId: true, status: true },
    });

    if (!order) return apiError("NOT_FOUND", "Order not found", headers);

    if (order.status !== "SHIPPED") {
      return apiError(
        "CONFLICT",
        `Order must be in SHIPPED state to mark as delivered (current: ${order.status})`,
        headers
      );
    }

    await prismadb.order.update({
      where: { id: orderId },
      data: { status: "DELIVERED" },
    });

    notifyOrderEvent(order.orderId, "ORDER_DELIVERED").catch((e) =>
      logger.error("[notify ORDER_DELIVERED]", e, { orderId: order.id })
    );

    return NextResponse.json({ status: "ok", orderId: order.id, newStatus: "DELIVERED" }, { headers });
  } catch (error) {
    logger.error("[DELIVER_POST]", error);
    return apiError("INTERNAL", "Failed to mark order as delivered", headers);
  }
}
