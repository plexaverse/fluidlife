import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { requireAdmin, isResponse } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { logger } from "@/lib/logger";
import { listPayments, type RazorpayPayment } from "@/lib/razorpay";
import { env } from "@/lib/env";

const MAX_LOOKBACK_DAYS = 31;

function parseSeconds(v: string | null, fallback: number): number {
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

/**
 * Compares the last `from..to` (unix-seconds) window of Razorpay captured
 * payments against our local orders. Surfaces three buckets:
 *   - matched: Razorpay payment id matches an Order with isPaid=true
 *   - localUnpaid: Razorpay says captured but our Order is still PAYMENT_PENDING
 *                  (most actionable — webhook missed)
 *   - razorpayMissing: we have an Order with razorpayPaymentId set, but the
 *                      payment wasn't returned by Razorpay in the window
 *                      (cross-window issue, usually safe to ignore)
 *
 * Auth: admin-only. Intended to be triggered hourly by Cloud Scheduler.
 */
export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (isResponse(auth)) return auth;

  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    return apiError("INTERNAL", "Razorpay API credentials not configured");
  }

  try {
    const { searchParams } = new URL(req.url);
    const now = Math.floor(Date.now() / 1000);
    const defaultFrom = now - 60 * 60 * 24; // last 24h
    const from = parseSeconds(searchParams.get("from"), defaultFrom);
    const to = parseSeconds(searchParams.get("to"), now);
    if (to - from > MAX_LOOKBACK_DAYS * 86400) {
      return apiError("BAD_REQUEST", `Window cannot exceed ${MAX_LOOKBACK_DAYS} days`);
    }

    // Page through Razorpay payments (100 per page).
    const all: RazorpayPayment[] = [];
    let skip = 0;
    while (true) {
      const page = await listPayments({ from, to, count: 100, skip });
      all.push(...page.items);
      if (page.items.length < 100 || all.length >= 5000) break;
      skip += 100;
    }

    const captured = all.filter((p) => p.status === "captured");

    // Pull every local order that was created in (or for) this window.
    const localPaid = await prismadb.order.findMany({
      where: {
        OR: [
          { createdAt: { gte: new Date(from * 1000), lte: new Date(to * 1000) } },
          { paidAt: { gte: new Date(from * 1000), lte: new Date(to * 1000) } },
        ],
      },
      select: {
        id: true,
        orderId: true,
        amount: true,
        isPaid: true,
        status: true,
        paymentType: true,
        razorpayPaymentId: true,
      },
    });

    const localByPaymentId = new Map(
      localPaid.filter((o) => o.razorpayPaymentId).map((o) => [o.razorpayPaymentId!, o])
    );

    const matched: { paymentId: string; orderId: string }[] = [];
    const localUnpaid: { paymentId: string; orderId?: string; amount: number; notesOrderId?: string }[] = [];

    for (const p of captured) {
      const local = localByPaymentId.get(p.id);
      if (local && local.isPaid) {
        matched.push({ paymentId: p.id, orderId: local.orderId });
        continue;
      }
      // Try to match by notes.orderId
      const notesOrderId = p.notes?.orderId;
      const byOrderId = notesOrderId
        ? localPaid.find((o) => o.orderId === notesOrderId)
        : undefined;
      localUnpaid.push({
        paymentId: p.id,
        orderId: byOrderId?.orderId,
        amount: p.amount / 100,
        notesOrderId,
      });
    }

    const razorpayMissing = localPaid
      .filter((o) => o.razorpayPaymentId && o.isPaid && !captured.some((p) => p.id === o.razorpayPaymentId))
      .map((o) => ({ orderId: o.orderId, paymentId: o.razorpayPaymentId! }));

    if (localUnpaid.length > 0) {
      logger.warn("[reconcile] captured payments without paid orders", { count: localUnpaid.length });
    }

    return NextResponse.json({
      window: { from, to },
      summary: {
        razorpayCaptured: captured.length,
        matched: matched.length,
        localUnpaid: localUnpaid.length,
        razorpayMissing: razorpayMissing.length,
      },
      localUnpaid,
      razorpayMissing,
    });
  } catch (error: any) {
    logger.error("[RECONCILE]", error);
    return apiError("INTERNAL", "Reconciliation failed");
  }
}
