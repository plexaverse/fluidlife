import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/notify", () => ({ notifyOrderEvent: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/auth", () => ({
  requireAdmin: vi.fn().mockResolvedValue({ ok: true }),
  isResponse: (x: unknown) =>
    !!x && typeof x === "object" && "status" in (x as any) && typeof (x as any).status === "number",
}));
vi.mock("@/lib/razorpay", () => ({
  createRefund: vi.fn(),
}));

const mockOrderItems = [
  { productId: "prod-1", quantity: 2 },
  { productId: "prod-2", quantity: 1 },
];
const mockOrder = {
  id: "order-db-1",
  orderId: "ORD-ABCD1234",
  status: "ORDERED",
  isPaid: true,
  razorpayPaymentId: "pay-001",
  refundedAt: null,
  couponId: null,
  userId: "user-1",
  paymentType: "PREPAID",
  amount: new Prisma.Decimal("500.00"),
  orderItems: mockOrderItems,
};

vi.mock("@/lib/prismadb", () => {
  const order = { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() };
  const product = { update: vi.fn() };
  const coupon = { updateMany: vi.fn() };
  const user = { update: vi.fn() };
  return {
    default: {
      order,
      product,
      coupon,
      user,
      $transaction: vi.fn(async (cb: any) => cb({ order, product, coupon, user })),
    },
  };
});

import prismadb from "@/lib/prismadb";
import { createRefund } from "@/lib/razorpay";
import { requireAdmin } from "@/lib/auth";
import { POST } from "@/app/api/orders/[orderId]/refund/route";

const db = prismadb as any;
const mockCreateRefund = createRefund as ReturnType<typeof vi.fn>;
const mockRequireAdmin = requireAdmin as ReturnType<typeof vi.fn>;

function makeReq(body: unknown = {}) {
  return new Request("http://localhost/api/orders/order-db-1/refund", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const params = { params: Promise.resolve({ orderId: "order-db-1" }) };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.RAZORPAY_KEY_ID = "key_test";
  process.env.RAZORPAY_KEY_SECRET = "secret_test";
  db.order.findUnique.mockResolvedValue(mockOrder);
  db.order.update.mockResolvedValue({});
  db.product.update.mockResolvedValue({});
  db.coupon.updateMany.mockResolvedValue({ count: 0 });
  db.user.update.mockResolvedValue({});
  mockCreateRefund.mockResolvedValue({ id: "ref-001", status: "processed" });
});

describe("POST /api/orders/[orderId]/refund", () => {
  it("returns 401 when not admin", async () => {
    mockRequireAdmin.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { code: "UNAUTHORIZED" } }), { status: 401 })
    );
    const res = await POST(makeReq(), params);
    expect(res.status).toBe(401);
  });

  it("returns 404 when order not found", async () => {
    db.order.findUnique.mockResolvedValue(null);
    const res = await POST(makeReq(), params);
    expect(res.status).toBe(404);
  });

  it("returns 409 when order is not in refundable state", async () => {
    db.order.findUnique.mockResolvedValue({ ...mockOrder, status: "PAYMENT_PENDING" });
    const res = await POST(makeReq(), params);
    expect(res.status).toBe(409);
  });

  it("returns 409 when order not paid", async () => {
    db.order.findUnique.mockResolvedValue({ ...mockOrder, isPaid: false });
    const res = await POST(makeReq(), params);
    expect(res.status).toBe(409);
  });

  it("returns 409 when no Razorpay payment ID", async () => {
    db.order.findUnique.mockResolvedValue({ ...mockOrder, razorpayPaymentId: null });
    const res = await POST(makeReq(), params);
    expect(res.status).toBe(409);
  });

  it("returns 409 when already refunded", async () => {
    db.order.findUnique.mockResolvedValue({ ...mockOrder, refundedAt: new Date() });
    const res = await POST(makeReq(), params);
    expect(res.status).toBe(409);
  });

  it("returns 400 when requested amount exceeds order total", async () => {
    const res = await POST(makeReq({ amount: 9999 }), params);
    expect(res.status).toBe(400);
  });

  it("happy path: full refund restores stock and marks order REFUNDED", async () => {
    const res = await POST(makeReq(), params);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.refundId).toBe("ref-001");
    expect(body.amount).toBe("500.00");

    // createRefund called without amount = full refund
    expect(mockCreateRefund).toHaveBeenCalledWith(
      expect.objectContaining({ paymentId: "pay-001", amount: undefined })
    );

    // order status updated inside transaction
    expect(db.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "order-db-1" },
        data: expect.objectContaining({ status: "REFUNDED" }),
      })
    );

    // stock restored for each item
    expect(db.product.update).toHaveBeenCalledTimes(2);
    expect(db.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "prod-1" },
        data: { stock: { increment: 2 } },
      })
    );
  });

  it("partial refund: passes correct paise amount to Razorpay", async () => {
    const res = await POST(makeReq({ amount: 100 }), params);
    expect(res.status).toBe(200);

    expect(mockCreateRefund).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 10000 }) // 100 * 100 paise
    );
    const body = await res.json();
    expect(body.amount).toBe("100.00");
  });

  it("coupon usage decremented when coupon was applied", async () => {
    db.order.findUnique.mockResolvedValue({ ...mockOrder, couponId: "coup-1" });
    await POST(makeReq(), params);
    expect(db.coupon.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "coup-1", usedCount: { gt: 0 } },
        data: { usedCount: { decrement: 1 } },
      })
    );
  });

  it("distributor credit released for COD order", async () => {
    db.order.findUnique.mockResolvedValue({ ...mockOrder, paymentType: "COD" });
    await POST(makeReq(), params);
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: { creditUsed: { decrement: expect.anything() } },
      })
    );
  });

  it("no credit release for PREPAID order", async () => {
    await POST(makeReq(), params);
    expect(db.user.update).not.toHaveBeenCalled();
  });
});
