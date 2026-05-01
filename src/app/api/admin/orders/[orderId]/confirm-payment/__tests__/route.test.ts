import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/notify", () => ({ notifyOrderEvent: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/auth", () => ({
  requireAdmin: vi.fn().mockResolvedValue({ ok: true }),
  isResponse: (x: unknown) =>
    !!x && typeof x === "object" && "status" in (x as any) && typeof (x as any).status === "number",
}));
vi.mock("@/lib/prismadb", () => ({
  default: {
    order: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

import prismadb from "@/lib/prismadb";
import { requireAdmin } from "@/lib/auth";
import { notifyOrderEvent } from "@/lib/notify";
import { POST } from "@/app/api/admin/orders/[orderId]/confirm-payment/route";

const db = prismadb as any;
const mockNotify = notifyOrderEvent as ReturnType<typeof vi.fn>;
const mockRequireAdmin = requireAdmin as ReturnType<typeof vi.fn>;

const mockOrder = {
  id: "order-db-1",
  orderId: "ORD-CONF01",
  isPaid: false,
  status: "ORDERED",
  paymentType: "COD",
};

function makeReq() {
  return new Request("http://localhost/api/admin/orders/order-db-1/confirm-payment", {
    method: "POST",
  });
}
const params = { params: Promise.resolve({ orderId: "order-db-1" }) };

beforeEach(() => {
  vi.clearAllMocks();
  db.order.findUnique.mockResolvedValue(mockOrder);
  db.order.update.mockResolvedValue({ ...mockOrder, isPaid: true });
});

describe("POST /api/admin/orders/[orderId]/confirm-payment", () => {
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

  it("returns 409 for PREPAID orders", async () => {
    db.order.findUnique.mockResolvedValue({ ...mockOrder, paymentType: "PREPAID" });
    const res = await POST(makeReq(), params);
    expect(res.status).toBe(409);
  });

  it("returns 409 when order is already paid", async () => {
    db.order.findUnique.mockResolvedValue({ ...mockOrder, isPaid: true });
    const res = await POST(makeReq(), params);
    expect(res.status).toBe(409);
  });

  it("returns 409 for CANCELLED order", async () => {
    db.order.findUnique.mockResolvedValue({ ...mockOrder, status: "CANCELLED" });
    const res = await POST(makeReq(), params);
    expect(res.status).toBe(409);
  });

  it("happy path COD: marks order as paid and fires notification", async () => {
    const res = await POST(makeReq(), params);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.isPaid).toBe(true);

    expect(db.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "order-db-1" },
        data: expect.objectContaining({ isPaid: true }),
      })
    );

    await Promise.resolve();
    expect(mockNotify).toHaveBeenCalledWith("ORD-CONF01", "ORDER_CONFIRMED");
  });

  it("happy path BANK_TRANSFER: also accepted", async () => {
    db.order.findUnique.mockResolvedValue({ ...mockOrder, paymentType: "BANK_TRANSFER" });
    const res = await POST(makeReq(), params);
    expect(res.status).toBe(200);
  });
});
