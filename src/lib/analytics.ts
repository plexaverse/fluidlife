import "server-only";
import { logger } from "./logger";

export type AnalyticsEventName =
  | "order.created"
  | "order.paid"
  | "order.shipped"
  | "order.delivered"
  | "order.refunded"
  | "order.cancelled";

export interface AnalyticsEvent {
  event: AnalyticsEventName;
  orderId?: string;
  userId?: string;
  amount?: string;
  paymentType?: string;
  timestamp: string;
  [key: string]: unknown;
}

/**
 * Fire-and-forget POST to ANALYTICS_WEBHOOK_URL with the event payload.
 * No-op when the env var is absent. Failures are logged but never thrown —
 * analytics must never break the order flow.
 */
export function trackEvent(event: AnalyticsEventName, payload: Omit<AnalyticsEvent, "event" | "timestamp">): void {
  const url = process.env.ANALYTICS_WEBHOOK_URL;
  if (!url) return;

  const body: AnalyticsEvent = {
    event,
    timestamp: new Date().toISOString(),
    ...payload,
  };

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch((err) => {
    logger.error("[analytics] delivery failed", { event, error: err?.message });
  });
}
