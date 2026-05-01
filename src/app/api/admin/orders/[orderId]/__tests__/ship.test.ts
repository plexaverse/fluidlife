import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/notify", () => ({ notifyOrderEvent: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/auth", () => ({
  requireAdmin: vi.fn().mockResolvedValue({ ok: true }),
  isResponse: (x: unknown) =>
    !!x && typeof x === "object" && "status" in (x as any) && typeof (x as any).status === "number",
}));
vi.mock("@/lib/shiprocket", () => ({
  createShiprocketOrder: vi.fn(),
  recordShiprocketOrder: vi.fn(),
}));
vi.mock("@/lib/prismadb", () => ({
  default: { order: { findUnique: vi.fn() } },
}));

import prismadb from "@/lib/prismadb";
import { createShiprocketOrder, recordShiprocketOrder } from "@/lib/shiprocket";
import { requireAdmin } from "@/lib/auth";
import { POST } from "@/app/api/admin/orders/[orderId]/ship/route";

const db = prismadb as any;
const mockCreate = createShiprocketOrder as ReturnType<typeof vi.fn>;
const mockRecord = recordShiprocketOrder as ReturnType<typeof vi.fn>;
const mockRequireAdmin = requireAdmin as ReturnType<typeof vi.fn>;

const mockOrder = {
  id: "order-db-1",
  orderId: "ORD-ABCD1234",
  status: "ORDERED",
  paymentType: "PREPAID",
  subtotalAmount: "500.00",
  createdAt: new Date("2026-05-01T00:00:00.000Z"),
  shiprocketOrderId: null,
  user: { id: "user-1", name: "Test User", email: "test@example.com", phone: "9999999999" },
  address: {
    address1: "123 Main St",
    address2: null,
    city: "Mumbai",
    pincode: "400001",
    state: "Maharashtra",
    country: "India",
  },
  orderItems: [
    {
      quantity: 2,
      priceAtPurchase: "250.00",
      product: { id: "prod-1", name: "Product A", hsnCode: null, length: 10, breadth: 10, height: 10, weight: 500 },
    },
  ],
};

const params = { params: Promise.resolve({ orderId: "order-db-1" }) };

function makeReq() {
  return new Request("http://localhost/api/admin/orders/order-db-1/ship", { method: "POST" });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.SHIPROCKET_PICKUP_LOCATION = "Primary";
  db.order.findUnique.mockResolvedValue(mockOrder);
  mockCreate.mockResolvedValue({ shiprocketOrderId: "sr-999", shipmentId: "shp-1", status: "NEW", raw: {} });
  mockRecord.mockResolvedValue(undefined);
});

describe("POST /api/admin/orders/[orderId]/ship", () => {
  it("returns 401 when not admin", async () => {
    mockRequireAdmin.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { code: "UNAUTHORIZED" } }), { status: 401 })
    );
    const res = await POST(makeReq(), params);
    expect(res.status).toBe(401);
  });

  it("returns 500 when SHIPROCKET_PICKUP_LOCATION not configured", async () => {
    delete process.env.SHIPROCKET_PICKUP_LOCATION;
    const res = await POST(makeReq(), params);
    expect(res.status).toBe(500);
  });

  it("returns 404 when order not found", async () => {
    db.order.findUnique.mockResolvedValue(null);
    const res = await POST(makeReq(), params);
    expect(res.status).toBe(404);
  });

  it("returns 409 when order is not in ORDERED state", async () => {
    db.order.findUnique.mockResolvedValue({ ...mockOrder, status: "SHIPPED" });
    const res = await POST(makeReq(), params);
    expect(res.status).toBe(409);
  });

  it("returns 409 when order already has a Shiprocket order ID", async () => {
    db.order.findUnique.mockResolvedValue({ ...mockOrder, shiprocketOrderId: "sr-existing" });
    const res = await POST(makeReq(), params);
    expect(res.status).toBe(409);
  });

  it("happy path: creates Shiprocket order and records it", async () => {
    const res = await POST(makeReq(), params);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.shiprocketOrderId).toBe("sr-999");
    expect(json.shipmentId).toBe("shp-1");

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: "ORD-ABCD1234",
        pickupLocation: "Primary",
        billingPhone: "9999999999",
        paymentMethod: "Prepaid",
      })
    );
    expect(mockRecord).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: "ORD-ABCD1234", shiprocketOrderId: "sr-999" })
    );
  });

  it("uses COD payment method for COD orders", async () => {
    db.order.findUnique.mockResolvedValue({ ...mockOrder, paymentType: "COD" });
    await POST(makeReq(), params);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ paymentMethod: "COD" })
    );
  });

  it("skips placeholder email for billing", async () => {
    db.order.findUnique.mockResolvedValue({
      ...mockOrder,
      user: { ...mockOrder.user, email: "9999999999@placeholder.fluidlife.local" },
    });
    await POST(makeReq(), params);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ billingEmail: undefined })
    );
  });

  it("returns 500 when Shiprocket API throws", async () => {
    mockCreate.mockRejectedValue(new Error("Shiprocket API down"));
    const res = await POST(makeReq(), params);
    expect(res.status).toBe(500);
  });
});
