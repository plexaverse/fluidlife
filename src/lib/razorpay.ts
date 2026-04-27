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
