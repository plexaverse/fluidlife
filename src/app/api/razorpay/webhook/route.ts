import { NextResponse } from "next/server";
import crypto from "crypto";
import prismadb from "@/lib/prismadb";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { readBody } from "@/lib/safe-json";
import { notifyOrderEvent } from "@/lib/notify";
import { trackEvent } from "@/lib/analytics";

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("x-razorpay-signature");
    if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 401 });

    const r = await readBody(req, { maxBytes: 100_000 });
    if (!r.ok) return r.response;
    const rawBody = r.raw;
    const expected = crypto.createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest("hex");
    if (!timingSafeEqualHex(signature, expected)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const eventId: string | undefined = body?.id;
    if (!eventId) return NextResponse.json({ error: "Missing event id" }, { status: 400 });

    try {
      await prismadb.webhookEvent.create({ data: { id: eventId, source: "razorpay" } });
    } catch (e: any) {
      if (e?.code === "P2002") return NextResponse.json({ status: "duplicate" });
      throw e;
    }

    const event: string = body.event;
    const payment = body?.payload?.payment?.entity;
    const orderRef: string | undefined = payment?.notes?.orderId;
    const paymentId: string | undefined = payment?.id;
    const razorpayOrderId: string | undefined = payment?.order_id;

    if (!orderRef) return NextResponse.json({ status: "ignored", reason: "no orderId in notes" });

    if (event === "payment.captured" || event === "payment.authorized") {
      // Atomically mark paid; only fire side-effects on the first transition.
      const updated = await prismadb.order.updateMany({
        where: { orderId: orderRef, isPaid: false },
        data: {
          isPaid: true,
          status: "ORDERED",
          paidAt: new Date(),
          razorpayPaymentId: paymentId ?? null,
          razorpayOrderId: razorpayOrderId ?? null,
        },
      });
      if (updated.count > 0) {
        notifyOrderEvent(orderRef, "ORDER_CONFIRMED").catch((e) =>
          logger.error("[notify ORDER_CONFIRMED]", e, { orderRef })
        );
        trackEvent("order.paid", { orderId: orderRef });
      }
      return NextResponse.json({ status: "ok", updated: updated.count });
    }

    if (event === "payment.failed") {
      // Single-attempt failure; user can retry until paymentExpiresAt elapses.
      // Cleanup is handled by the pg_cron `release_expired_orders` job.
      return NextResponse.json({ status: "noted" });
    }

    return NextResponse.json({ status: "ignored", event });
  } catch (error) {
    logger.error("[RAZORPAY_WEBHOOK]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
