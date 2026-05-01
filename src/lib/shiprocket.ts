import "server-only";
import prismadb from "./prismadb";
import { logger } from "./logger";

const BASE = "https://apiv2.shiprocket.in/v1/external";

// ── Token cache (24 h TTL per Shiprocket docs) ──────────────────────────────

let _token: string | null = null;
let _tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (_token && Date.now() < _tokenExpiry) return _token;

  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  if (!email || !password) {
    throw new Error("SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD are required");
  }

  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Shiprocket auth failed (${res.status}): ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  if (!data.token) throw new Error("Shiprocket auth: no token in response");

  _token = data.token as string;
  // Expire 30 minutes before the actual 24 h expiry to avoid edge-case races.
  _tokenExpiry = Date.now() + 23.5 * 60 * 60 * 1000;
  return _token;
}

// ── Shiprocket order creation ────────────────────────────────────────────────

export interface ShiprocketOrderItem {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
  discount?: number;
  tax?: string;
  hsn?: string;
}

export interface CreateShiprocketOrderParams {
  orderId: string;
  orderDate: string; // ISO date string
  pickupLocation: string;
  billingName: string;
  billingAddress: string;
  billingAddress2?: string;
  billingCity: string;
  billingPincode: string;
  billingState: string;
  billingCountry: string;
  billingEmail?: string;
  billingPhone: string;
  items: ShiprocketOrderItem[];
  paymentMethod: "Prepaid" | "COD";
  subTotal: number;
  length?: number;
  breadth?: number;
  height?: number;
  weight?: number;
}

export interface ShiprocketOrderResult {
  shiprocketOrderId: string;
  shipmentId?: string;
  status?: string;
  raw: unknown;
}

export async function createShiprocketOrder(
  p: CreateShiprocketOrderParams
): Promise<ShiprocketOrderResult> {
  const token = await getToken();

  const payload = {
    order_id: p.orderId,
    order_date: p.orderDate,
    pickup_location: p.pickupLocation,
    billing_customer_name: p.billingName,
    billing_last_name: "",
    billing_address: p.billingAddress,
    billing_address_2: p.billingAddress2 ?? "",
    billing_city: p.billingCity,
    billing_pincode: p.billingPincode,
    billing_state: p.billingState,
    billing_country: p.billingCountry,
    billing_email: p.billingEmail ?? "",
    billing_phone: p.billingPhone,
    shipping_is_billing: true,
    order_items: p.items,
    payment_method: p.paymentMethod,
    sub_total: p.subTotal,
    length: p.length ?? 10,
    breadth: p.breadth ?? 10,
    height: p.height ?? 10,
    weight: p.weight ?? 0.5,
  };

  const res = await fetch(`${BASE}/orders/create/adhoc`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const raw = await res.json().catch(() => ({}));

  if (!res.ok) {
    logger.error("[shiprocket] createOrder failed", { status: res.status, raw });
    throw new Error(
      `Shiprocket createOrder failed (${res.status}): ${JSON.stringify(raw).slice(0, 300)}`
    );
  }

  const shiprocketOrderId = String(raw.order_id ?? raw.shiprocket_order_id ?? "");
  if (!shiprocketOrderId) {
    throw new Error(`Shiprocket createOrder: missing order_id in response: ${JSON.stringify(raw).slice(0, 300)}`);
  }

  return {
    shiprocketOrderId,
    shipmentId: raw.shipment_id ? String(raw.shipment_id) : undefined,
    status: raw.status,
    raw,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Persist the Shiprocket order id on our Order so the webhook can find it
 * via an indexed lookup (Order.shiprocketOrderId @unique) instead of a
 * sequential scan over the JSON `shipRocket` blob.
 */
export async function recordShiprocketOrder(params: {
  orderId: string;
  shiprocketOrderId: string;
  raw?: unknown;
}): Promise<void> {
  await prismadb.order.update({
    where: { orderId: params.orderId },
    data: {
      shiprocketOrderId: params.shiprocketOrderId,
      ...(params.raw !== undefined && { shipRocket: params.raw as any }),
    },
  });
}

// Visible for testing only — reset the cached token between tests.
export function _resetTokenCache(): void {
  _token = null;
  _tokenExpiry = 0;
}
