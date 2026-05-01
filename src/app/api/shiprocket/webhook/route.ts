import crypto from "crypto";
import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { env } from "@/lib/env";
import { safeJson } from "@/lib/safe-json";
import { logger } from "@/lib/logger";
import { notifyOrderEvent } from "@/lib/notify";
import { trackEvent } from "@/lib/analytics";

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
  } catch {
    return false;
  }
}

const STATUS_MAP: Record<string, "ORDERED" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED"> = {
  pending: "ORDERED",
  confirmed: "ORDERED",
  shipped: "SHIPPED",
  in_transit: "SHIPPED",
  delivered: "DELIVERED",
  completed: "DELIVERED",
  cancelled: "CANCELLED",
  cancelled_by_customer: "CANCELLED",
  returned: "REFUNDED",
  refunded: "REFUNDED",
};

export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get("x-api-key") || req.headers.get("X-API-Key") || "";
    if (!safeEqual(apiKey, env.SHIPROCKET_WEBHOOK_TOKEN)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const r = await safeJson(req, { maxBytes: 100_000 });
    if (!r.ok) return r.response;
    const body = r.data as any;
    const orderId = typeof body?.order_id === "string" ? body.order_id : String(body?.order_id ?? "");
    const status = typeof body?.status === "string" ? body.status.toLowerCase() : "";
    const eventId =
      typeof body?.awb === "string" && status
        ? `shiprocket:${orderId}:${body.awb}:${status}`
        : `shiprocket:${orderId}:${status}:${Date.now()}`;

    if (!orderId) return NextResponse.json({ error: "Missing order_id" }, { status: 400 });

    const newStatus = STATUS_MAP[status];
    if (!newStatus) return NextResponse.json({ status: "ignored", reason: `unmapped status ${status}` });

    try {
      await prismadb.webhookEvent.create({ data: { id: eventId, source: "shiprocket" } });
    } catch (e: any) {
      if (e?.code === "P2002") return NextResponse.json({ status: "duplicate" });
      throw e;
    }

    const order = await prismadb.order.findUnique({
      where: { shiprocketOrderId: orderId },
      select: { id: true, orderId: true, status: true },
    });
    if (!order) return NextResponse.json({ status: "ignored", reason: "order not found" });

    if (order.status === newStatus) {
      return NextResponse.json({ status: "noop", orderId: order.id });
    }

    await prismadb.order.update({ where: { id: order.id }, data: { status: newStatus } });

    if (newStatus === "SHIPPED" || newStatus === "DELIVERED") {
      const evt = newStatus === "SHIPPED" ? "ORDER_SHIPPED" : "ORDER_DELIVERED";
      notifyOrderEvent(order.orderId, evt).catch((e) =>
        logger.error(`[notify ${evt}]`, e, { orderId: order.id })
      );
    }

    const analyticsEvt =
      newStatus === "SHIPPED" ? "order.shipped"
      : newStatus === "DELIVERED" ? "order.delivered"
      : newStatus === "CANCELLED" ? "order.cancelled"
      : newStatus === "REFUNDED" ? "order.refunded"
      : null;
    if (analyticsEvt) trackEvent(analyticsEvt, { orderId: order.orderId });

    return NextResponse.json({ status: "ok", orderId: order.id, newStatus });
  } catch (error) {
    logger.error("[SHIPROCKET_WEBHOOK]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
