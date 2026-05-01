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
import { POST } from "@/app/api/admin/orders/[orderId]/deliver/route";

const db = prismadb as any;
const mockNotify = notifyOrderEvent as ReturnType<typeof vi.fn>;
const mockRequireAdmin = requireAdmin as ReturnType<typeof vi.fn>;

const mockOrder = {
  id: "order-db-1",
  orderId: "ORD-DELIV01",
  status: "SHIPPED",
};

function makeReq() {
  return new Request("http://localhost/api/admin/orders/order-db-1/deliver", { method: "POST" });
}
const params = { params: Promise.resolve({ orderId: "order-db-1" }) };

beforeEach(() => {
  vi.clearAllMocks();
  db.order.findUnique.mockResolvedValue(mockOrder);
  db.order.update.mockResolvedValue({ ...mockOrder, status: "DELIVERED" });
});

describe("POST /api/admin/orders/[orderId]/deliver", () => {
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

  it("returns 409 when order is not in SHIPPED state", async () => {
    for (const status of ["ORDERED", "DELIVERED", "CANCELLED", "REFUNDED", "PAYMENT_PENDING"]) {
      db.order.findUnique.mockResolvedValue({ ...mockOrder, status });
      const res = await POST(makeReq(), params);
      expect(res.status).toBe(409);
    }
  });

  it("happy path: updates status to DELIVERED and fires notification", async () => {
    const res = await POST(makeReq(), params);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.newStatus).toBe("DELIVERED");

    expect(db.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "order-db-1" },
        data: { status: "DELIVERED" },
      })
    );

    await Promise.resolve();
    expect(mockNotify).toHaveBeenCalledWith("ORD-DELIV01", "ORDER_DELIVERED");
  });
});
