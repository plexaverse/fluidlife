"use client";

import { safePost } from "./api-client";

export type PaymentType = "PREPAID" | "COD" | "UPI" | "BANK_TRANSFER";

export interface CheckoutItem {
  productId: string;
  quantity: number;
}

export interface CheckoutInput {
  addressId: string;
  paymentType: PaymentType;
  items: CheckoutItem[];
  couponCode?: string;
  /** Optional storefront-quoted delivery cost; server clamps & may zero it if free-ship threshold met */
  deliveryAmount?: number;
  /** Replay-safe — generate with crypto.randomUUID() before submit */
  idempotencyKey?: string;
}

/** Echoes the server's Order row (subset relevant to the storefront). */
export interface CreatedOrder {
  id: string;
  orderId: string; // public ORD-... id
  status: string;
  paymentType: PaymentType;
  isPaid: boolean;
  amount: string; // Prisma Decimal → string
  subtotalAmount: string;
  discountAmount: string;
  taxAmount: string;
  deliveryAmount: string;
  paymentExpiresAt: string | null;
  razorpayOrderId: string | null;
  orderItems: { productId: string; quantity: number; priceAtPurchase: string }[];
}

export async function createCheckout(input: CheckoutInput): Promise<CreatedOrder> {
  return safePost<CreatedOrder>("/checkout", input);
}

// ── Razorpay client-side SDK helpers ────────────────────────────────────

declare global {
  interface Window {
    Razorpay?: any;
  }
}

const RAZORPAY_SDK_URL = "https://checkout.razorpay.com/v1/checkout.js";

let sdkPromise: Promise<boolean> | null = null;

/** Lazily inject Razorpay's checkout.js (idempotent). */
export function loadRazorpaySdk(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise<boolean>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_SDK_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const s = document.createElement("script");
    s.src = RAZORPAY_SDK_URL;
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
  return sdkPromise;
}

export interface RazorpayOpenOptions {
  amountInPaise: number;
  currency?: "INR";
  /** Public razorpay key id — NEXT_PUBLIC_RAZORPAY_KEY_ID */
  keyId: string;
  /** Our Order.orderId (public ORD-...) — surfaced to the webhook via notes.orderId */
  orderId: string;
  /** Razorpay's order id, if you created one server-side (recommended for live keys) */
  razorpayOrderId?: string | null;
  prefill?: { name?: string; email?: string; contact?: string };
  onSuccess: (resp: { razorpay_payment_id: string; razorpay_order_id?: string; razorpay_signature?: string }) => void;
  onDismiss?: () => void;
  onFailure?: (reason: any) => void;
}

/**
 * Open the Razorpay checkout overlay. Caller is responsible for having
 * already created our Order via createCheckout(); the result is the
 * Razorpay payment id, which the server will reconcile via the webhook.
 */
export function openRazorpayCheckout(opts: RazorpayOpenOptions): void {
  if (typeof window === "undefined" || !window.Razorpay) {
    opts.onFailure?.(new Error("Razorpay SDK not loaded"));
    return;
  }
  const rzp = new window.Razorpay({
    key: opts.keyId,
    amount: opts.amountInPaise,
    currency: opts.currency ?? "INR",
    name: "Fluidlife",
    description: `Order ${opts.orderId}`,
    notes: { orderId: opts.orderId },
    ...(opts.razorpayOrderId && { order_id: opts.razorpayOrderId }),
    prefill: opts.prefill ?? {},
    handler: opts.onSuccess,
    modal: { ondismiss: opts.onDismiss },
    theme: { color: "#7c3aed" },
  });
  rzp.on("payment.failed", (response: any) => opts.onFailure?.(response.error));
  rzp.open();
}
