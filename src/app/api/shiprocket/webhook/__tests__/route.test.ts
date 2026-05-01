import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/notify", () => ({ notifyOrderEvent: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/prismadb", () => ({
  default: {
    webhookEvent: { create: vi.fn() },
    order: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

import prismadb from "@/lib/prismadb";
import { POST } from "@/app/api/shiprocket/webhook/route";

const db = prismadb as any;
const API_KEY = "test-shiprocket";

const mockOrder = { id: "order-db-1", orderId: "ORD-ABCD1234", status: "PAYMENT_PENDING" };

function makeReq(body: unknown, key = API_KEY) {
  return new Request("http://localhost/api/shiprocket/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  db.webhookEvent.create.mockResolvedValue({});
  db.order.findUnique.mockResolvedValue(mockOrder);
  db.order.update.mockResolvedValue({});
});

describe("POST /api/shiprocket/webhook", () => {
  it("returns 401 for missing API key", async () => {
    const req = new Request("http://localhost/api/shiprocket/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: "123", status: "shipped" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 for wrong API key", async () => {
    const res = await POST(makeReq({ order_id: "123", status: "shipped" }, "bad-key"));
    expect(res.status).toBe(401);
  });

  it("returns 400 when order_id is missing", async () => {
    const res = await POST(makeReq({ status: "shipped" }));
    expect(res.status).toBe(400);
  });

  it("returns ignored for unmapped status", async () => {
    const res = await POST(makeReq({ order_id: "123", status: "UNKNOWN_STATUS" }));
    const json = await res.json();
    expect(json.status).toBe("ignored");
    expect(json.reason).toMatch(/unmapped/);
  });

  it("returns ignored when order not found in DB", async () => {
    db.order.findUnique.mockResolvedValue(null);
    const res = await POST(makeReq({ order_id: "123", status: "shipped" }));
    const json = await res.json();
    expect(json.status).toBe("ignored");
    expect(json.reason).toMatch(/not found/);
  });

  it("returns duplicate for already-processed event", async () => {
    db.webhookEvent.create.mockRejectedValue({ code: "P2002" });
    const res = await POST(makeReq({ order_id: "123", status: "shipped", awb: "AWB001" }));
    const json = await res.json();
    expect(json.status).toBe("duplicate");
  });

  it("returns noop when order already has the target status", async () => {
    db.order.findUnique.mockResolvedValue({ ...mockOrder, status: "SHIPPED" });
    const res = await POST(makeReq({ order_id: "123", status: "shipped", awb: "AWB001" }));
    const json = await res.json();
    expect(json.status).toBe("noop");
    expect(db.order.update).not.toHaveBeenCalled();
  });

  it.each([
    ["shipped", "SHIPPED"],
    ["in_transit", "SHIPPED"],
    ["delivered", "DELIVERED"],
    ["completed", "DELIVERED"],
    ["cancelled", "CANCELLED"],
    ["cancelled_by_customer", "CANCELLED"],
    ["returned", "REFUNDED"],
    ["refunded", "REFUNDED"],
    ["pending", "ORDERED"],
    ["confirmed", "ORDERED"],
  ])("maps shiprocket status '%s' → '%s'", async (srStatus, appStatus) => {
    const res = await POST(makeReq({ order_id: "ship-123", status: srStatus, awb: "AWB001" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("ok");
    expect(json.newStatus).toBe(appStatus);
    expect(db.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: appStatus } })
    );
  });
});
