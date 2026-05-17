"use client";

import { safeGet, safePut } from "./api-client";

// Note: safePut isn't in api-client.ts yet — we add it inline below if needed.
// Cancel uses PUT /api/orders/cancel/[orderId].

export interface OrderListItem {
  id: string;
  orderId: string;
  status: string;
  isPaid: boolean;
  paymentType: string;
  amount: string;
  subtotalAmount: string;
  discountAmount: string;
  taxAmount: string;
  deliveryAmount: string;
  invoiceNumber: string | null;
  razorpayPaymentId: string | null;
  razorpayOrderId: string | null;
  paymentExpiresAt: string | null;
  paidAt: string | null;
  refundedAt: string | null;
  refundAmount: string | null;
  createdAt: string;
  orderItems: {
    id: string;
    quantity: number;
    priceAtPurchase: string;
    product: {
      id: string;
      name: string;
      price: string;
      images: { url: string }[];
    };
  }[];
  address: {
    id: string;
    address1: string;
    address2: string | null;
    city: string;
    state: string;
    pincode: string | null;
    country: string;
  };
  coupon: { code: string } | null;
}

export async function listOrders(userId: string, params?: { take?: number; skip?: number }) {
  const qs = new URLSearchParams();
  if (params?.take) qs.set("take", String(params.take));
  if (params?.skip) qs.set("skip", String(params.skip));
  const q = qs.toString();
  return safeGet<OrderListItem[]>(`/users/${userId}/orders${q ? `?${q}` : ""}`);
}

export async function cancelOrder(orderId: string) {
  return safePut<OrderListItem>(`/orders/cancel/${orderId}`);
}
