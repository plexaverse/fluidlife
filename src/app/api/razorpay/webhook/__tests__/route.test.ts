import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/notify", () => ({ notifyOrderEvent: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/prismadb", () => ({
  default: {
    webhookEvent: { create: vi.fn() },
    order: { updateMany: vi.fn() },
  },
}));

import prismadb from "@/lib/prismadb";
import { POST } from "@/app/api/razorpay/webhook/route";

const db = prismadb as any;
const SECRET = "test-rzp";

function sign(body: string) {
  return crypto.createHmac("sha256", SECRET).update(body).digest("hex");
}

function makeReq(body: string, sig?: string) {
  return new Request("http://localhost/api/razorpay/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(sig !== undefined ? { "x-razorpay-signature": sig } : {}),
    },
    body,
  });
}

function capturedPayload(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    id: "evt-001",
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: "pay-001",
          order_id: "rzp-order-001",
          notes: { orderId: "ORD-ABCD1234" },
        },
      },
    },
    ...overrides,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  db.webhookEvent.create.mockResolvedValue({});
  db.order.updateMany.mockResolvedValue({ count: 1 });
});

describe("POST /api/razorpay/webhook", () => {
  it("returns 401 when signature header is missing", async () => {
    const res = await POST(makeReq(capturedPayload()));
    expect(res.status).toBe(401);
  });

  it("returns 401 for invalid signature", async () => {
    const body = capturedPayload();
    const res = await POST(makeReq(body, "bad-signature"));
    expect(res.status).toBe(401);
  });

  it("returns duplicate status for already-seen event id", async () => {
    const body = capturedPayload();
    db.webhookEvent.create.mockRejectedValue({ code: "P2002" });
    const res = await POST(makeReq(body, sign(body)));
    const json = await res.json();
    expect(json.status).toBe("duplicate");
  });

  it("returns 400 when event id is missing", async () => {
    const body = JSON.stringify({ event: "payment.captured" });
    const res = await POST(makeReq(body, sign(body)));
    expect(res.status).toBe(400);
  });

  it("payment.captured: marks order paid and returns ok", async () => {
    const body = capturedPayload();
    const res = await POST(makeReq(body, sign(body)));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("ok");
    expect(json.updated).toBe(1);

    expect(db.order.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { orderId: "ORD-ABCD1234", isPaid: false },
        data: expect.objectContaining({ isPaid: true, status: "ORDERED" }),
      })
    );
  });

  it("payment.authorized: also marks order paid", async () => {
    const body = capturedPayload({ event: "payment.authorized" });
    const res = await POST(makeReq(body, sign(body)));
    const json = await res.json();
    expect(json.status).toBe("ok");
    expect(db.order.updateMany).toHaveBeenCalledOnce();
  });

  it("payment.captured: no DB update when order already paid (count=0)", async () => {
    db.order.updateMany.mockResolvedValue({ count: 0 });
    const body = capturedPayload();
    const res = await POST(makeReq(body, sign(body)));
    const json = await res.json();
    expect(json.status).toBe("ok");
    expect(json.updated).toBe(0);
  });

  it("payment.failed: returns noted without touching orders", async () => {
    const body = capturedPayload({ event: "payment.failed" });
    const res = await POST(makeReq(body, sign(body)));
    const json = await res.json();
    expect(json.status).toBe("noted");
    expect(db.order.updateMany).not.toHaveBeenCalled();
  });

  it("unknown event: returns ignored", async () => {
    const body = capturedPayload({ event: "payment.dispute.created" });
    const res = await POST(makeReq(body, sign(body)));
    const json = await res.json();
    expect(json.status).toBe("ignored");
  });

  it("ignored when orderId missing from payment notes", async () => {
    const body = JSON.stringify({
      id: "evt-002",
      event: "payment.captured",
      payload: { payment: { entity: { id: "pay-002", notes: {} } } },
    });
    const res = await POST(makeReq(body, sign(body)));
    const json = await res.json();
    expect(json.status).toBe("ignored");
    expect(json.reason).toMatch(/orderId/);
  });
});
