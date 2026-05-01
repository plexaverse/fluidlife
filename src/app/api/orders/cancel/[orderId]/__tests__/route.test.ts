import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/notify", () => ({ notifyOrderEvent: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/auth", () => ({
  requireUser: vi.fn().mockResolvedValue({ userId: "user-1", role: "USER" }),
  isResponse: (x: unknown) =>
    !!x && typeof x === "object" && "status" in (x as any) && typeof (x as any).status === "number",
}));

const mockOrderItems = [
  { productId: "prod-1", quantity: 2 },
  { productId: "prod-2", quantity: 1 },
];
const mockOrder = {
  id: "order-db-1",
  orderId: "ORD-CANCEL01",
  userId: "user-1",
  status: "ORDERED",
  paymentType: "PREPAID",
  deletedAt: null,
  couponId: null,
  amount: new Prisma.Decimal("300.00"),
  orderItems: mockOrderItems,
};

vi.mock("@/lib/prismadb", () => {
  const order = { findUnique: vi.fn(), update: vi.fn() };
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
import { requireUser } from "@/lib/auth";
import { notifyOrderEvent } from "@/lib/notify";
import { PUT } from "@/app/api/orders/cancel/[orderId]/route";

const db = prismadb as any;
const mockNotify = notifyOrderEvent as ReturnType<typeof vi.fn>;
const mockRequireUser = requireUser as ReturnType<typeof vi.fn>;

function makeReq() {
  return new Request("http://localhost/api/orders/cancel/order-db-1", { method: "PUT" });
}
const params = { params: Promise.resolve({ orderId: "order-db-1" }) };

beforeEach(() => {
  vi.clearAllMocks();
  db.order.findUnique.mockResolvedValue(mockOrder);
  db.order.update.mockResolvedValue({ ...mockOrder, status: "CANCELLED" });
  db.product.update.mockResolvedValue({});
  db.coupon.updateMany.mockResolvedValue({ count: 0 });
  db.user.update.mockResolvedValue({});
});

describe("PUT /api/orders/cancel/[orderId]", () => {
  it("returns 401 when not authenticated", async () => {
    mockRequireUser.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { code: "UNAUTHORIZED" } }), { status: 401 })
    );
    const res = await PUT(makeReq(), params);
    expect(res.status).toBe(401);
  });

  it("returns 404 when order not found", async () => {
    db.order.findUnique.mockResolvedValue(null);
    const res = await PUT(makeReq(), params);
    expect(res.status).toBe(404);
  });

  it("returns 403 when user tries to cancel another user's order", async () => {
    db.order.findUnique.mockResolvedValue({ ...mockOrder, userId: "other-user" });
    const res = await PUT(makeReq(), params);
    expect(res.status).toBe(403);
  });

  it("returns 409 when order is in non-cancellable state", async () => {
    db.order.findUnique.mockResolvedValue({ ...mockOrder, status: "SHIPPED" });
    const res = await PUT(makeReq(), params);
    expect(res.status).toBe(409);
  });

  it("happy path: cancels order and restores stock", async () => {
    const res = await PUT(makeReq(), params);
    expect(res.status).toBe(200);

    expect(db.product.update).toHaveBeenCalledTimes(2);
    expect(db.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "prod-1" },
        data: { stock: { increment: 2 } },
      })
    );
    expect(db.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "CANCELLED" } })
    );
  });

  it("fires ORDER_CANCELLED notification after cancel", async () => {
    await PUT(makeReq(), params);
    // Notification is fire-and-forget; give the microtask queue a tick.
    await Promise.resolve();
    expect(mockNotify).toHaveBeenCalledWith("ORD-CANCEL01", "ORDER_CANCELLED");
  });

  it("decrements coupon usage when coupon was applied", async () => {
    db.order.findUnique.mockResolvedValue({ ...mockOrder, couponId: "coup-1" });
    await PUT(makeReq(), params);
    expect(db.coupon.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "coup-1", usedCount: { gt: 0 } },
        data: { usedCount: { decrement: 1 } },
      })
    );
  });

  it("releases distributor credit for COD order", async () => {
    db.order.findUnique.mockResolvedValue({ ...mockOrder, paymentType: "COD" });
    await PUT(makeReq(), params);
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: { creditUsed: { decrement: expect.anything() } },
      })
    );
  });

  it("does not touch credit for PREPAID order", async () => {
    await PUT(makeReq(), params);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("admin can cancel another user's order", async () => {
    mockRequireUser.mockResolvedValueOnce({ userId: "admin-1", role: "ADMIN" });
    db.order.findUnique.mockResolvedValue({ ...mockOrder, userId: "other-user" });
    const res = await PUT(makeReq(), params);
    expect(res.status).toBe(200);
  });
});
