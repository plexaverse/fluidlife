import "server-only";
import { env } from "./env";

const RAZORPAY_API = "https://api.razorpay.com/v1";

function authHeader(): string {
  const id = env.RAZORPAY_KEY_ID;
  const secret = env.RAZORPAY_KEY_SECRET;
  if (!id || !secret) throw new Error("Razorpay API credentials not configured");
  return "Basic " + Buffer.from(`${id}:${secret}`).toString("base64");
}

async function call<T>(path: string, init: RequestInit & { timeoutMs?: number }): Promise<T> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), init.timeoutMs ?? 10_000);
  try {
    const res = await fetch(`${RAZORPAY_API}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        ...(init.headers ?? {}),
        Authorization: authHeader(),
        "Content-Type": "application/json",
      },
    });
    const text = await res.text();
    let body: any = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = { raw: text };
    }
    if (!res.ok) {
      const err: any = new Error(`Razorpay ${res.status}: ${body?.error?.description ?? text.slice(0, 200)}`);
      err.status = res.status;
      err.body = body;
      throw err;
    }
    return body as T;
  } finally {
    clearTimeout(t);
  }
}

export type RazorpayRefund = {
  id: string;
  amount: number;
  currency: string;
  payment_id: string;
  status: string;
  created_at: number;
};

export async function createRefund(params: {
  paymentId: string;
  amount?: number; // in paise; omit for full refund
  speed?: "normal" | "optimum";
  notes?: Record<string, string>;
}): Promise<RazorpayRefund> {
  return call<RazorpayRefund>(`/payments/${encodeURIComponent(params.paymentId)}/refund`, {
    method: "POST",
    body: JSON.stringify({
      ...(params.amount !== undefined && { amount: params.amount }),
      speed: params.speed ?? "normal",
      ...(params.notes && { notes: params.notes }),
    }),
  });
}

export type RazorpayPayment = {
  id: string;
  order_id: string | null;
  status: string;
  amount: number;
  currency: string;
  created_at: number;
  notes: Record<string, string>;
};

export async function listPayments(params: {
  from?: number; // unix seconds
  to?: number;
  count?: number; // 1..100
  skip?: number;
}): Promise<{ count: number; items: RazorpayPayment[] }> {
  const q = new URLSearchParams();
  if (params.from !== undefined) q.set("from", String(params.from));
  if (params.to !== undefined) q.set("to", String(params.to));
  q.set("count", String(Math.min(Math.max(params.count ?? 100, 1), 100)));
  if (params.skip !== undefined) q.set("skip", String(params.skip));
  return call(`/payments?${q.toString()}`, { method: "GET" });
}

// ── Orders API ────────────────────────────────────────────────────────────

export type RazorpayOrder = {
  id: string;
  entity: "order";
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string | null;
  status: "created" | "attempted" | "paid";
  notes: Record<string, string>;
  created_at: number;
};

/**
 * Create a Razorpay order. The returned `id` ("order_X…") is what we save as
 * `Order.razorpayOrderId` and pass to the client SDK as `order_id`. This binds
 * the customer's payment to a server-known amount, so the amount can't be
 * tampered with client-side before the user pays.
 *
 * Required for live keys; recommended for test keys too.
 */
export async function createRazorpayOrder(params: {
  amount: number; // paise (integer)
  currency?: "INR";
  /** Our public Order.orderId — surfaces in the Razorpay dashboard for support */
  receipt: string;
  notes?: Record<string, string>;
  /** Razorpay supports per-order idempotency via this header */
  idempotencyKey?: string;
}): Promise<RazorpayOrder> {
  return call<RazorpayOrder>("/orders", {
    method: "POST",
    body: JSON.stringify({
      amount: Math.round(params.amount),
      currency: params.currency ?? "INR",
      receipt: params.receipt,
      ...(params.notes && { notes: params.notes }),
      payment_capture: 1, // auto-capture on successful payment
    }),
    headers: {
      ...(params.idempotencyKey && { "X-Razorpay-Idempotency-Key": params.idempotencyKey }),
    },
  });
}
