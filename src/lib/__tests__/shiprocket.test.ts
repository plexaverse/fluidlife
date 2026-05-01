import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prismadb", () => ({
  default: { order: { update: vi.fn() } },
}));

import prismadb from "@/lib/prismadb";
import { createShiprocketOrder, recordShiprocketOrder, _resetTokenCache } from "@/lib/shiprocket";

const db = prismadb as any;

const ORDER_PARAMS = {
  orderId: "ORD-TEST1",
  orderDate: "2026-05-01T00:00:00.000Z",
  pickupLocation: "Primary",
  billingName: "Test User",
  billingAddress: "123 Main St",
  billingCity: "Mumbai",
  billingPincode: "400001",
  billingState: "Maharashtra",
  billingCountry: "India",
  billingPhone: "9999999999",
  items: [{ name: "Product A", sku: "prod-1", units: 2, selling_price: 250 }],
  paymentMethod: "Prepaid" as const,
  subTotal: 500,
};

function mockFetch(responses: Array<{ ok: boolean; json?: unknown; text?: string; status?: number }>) {
  let i = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(() => {
      const r = responses[i++] ?? responses[responses.length - 1];
      return Promise.resolve({
        ok: r.ok,
        status: r.status ?? (r.ok ? 200 : 400),
        json: () => Promise.resolve(r.json ?? {}),
        text: () => Promise.resolve(r.text ?? ""),
      });
    })
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  _resetTokenCache();
  process.env.SHIPROCKET_EMAIL = "test@example.com";
  process.env.SHIPROCKET_PASSWORD = "secret";
  db.order.update.mockResolvedValue({});
});

describe("createShiprocketOrder", () => {
  it("fetches token then creates order", async () => {
    mockFetch([
      { ok: true, json: { token: "sr-token" } },
      { ok: true, json: { order_id: 12345, status: "NEW", shipment_id: 678 } },
    ]);

    const result = await createShiprocketOrder(ORDER_PARAMS);
    expect(result.shiprocketOrderId).toBe("12345");
    expect(result.shipmentId).toBe("678");
    expect(result.status).toBe("NEW");

    const calls = (fetch as any).mock.calls;
    expect(calls[0][0]).toContain("auth/login");
    expect(calls[1][0]).toContain("orders/create/adhoc");
  });

  it("reuses cached token on second call", async () => {
    mockFetch([
      { ok: true, json: { token: "sr-token" } },
      { ok: true, json: { order_id: 1 } },
      { ok: true, json: { order_id: 2 } },
    ]);
    await createShiprocketOrder(ORDER_PARAMS);
    await createShiprocketOrder(ORDER_PARAMS);
    // login called only once
    expect((fetch as any).mock.calls.filter((c: any[]) => c[0].includes("auth/login"))).toHaveLength(1);
  });

  it("throws when auth fails", async () => {
    mockFetch([{ ok: false, status: 401, text: "Unauthorized" }]);
    await expect(createShiprocketOrder(ORDER_PARAMS)).rejects.toThrow(/auth failed/);
  });

  it("throws when order creation fails", async () => {
    mockFetch([
      { ok: true, json: { token: "sr-token" } },
      { ok: false, status: 422, json: { message: "Invalid pickup location" } },
    ]);
    await expect(createShiprocketOrder(ORDER_PARAMS)).rejects.toThrow(/createOrder failed/);
  });

  it("throws when SHIPROCKET_EMAIL is missing", async () => {
    delete process.env.SHIPROCKET_EMAIL;
    await expect(createShiprocketOrder(ORDER_PARAMS)).rejects.toThrow(/SHIPROCKET_EMAIL/);
  });

  it("throws when response has no order_id", async () => {
    mockFetch([
      { ok: true, json: { token: "sr-token" } },
      { ok: true, json: { status: "NEW" } }, // missing order_id
    ]);
    await expect(createShiprocketOrder(ORDER_PARAMS)).rejects.toThrow(/missing order_id/);
  });
});

describe("recordShiprocketOrder", () => {
  it("updates order with shiprocketOrderId", async () => {
    await recordShiprocketOrder({ orderId: "ORD-1", shiprocketOrderId: "sr-999" });
    expect(db.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { orderId: "ORD-1" },
        data: expect.objectContaining({ shiprocketOrderId: "sr-999" }),
      })
    );
  });

  it("includes raw response when provided", async () => {
    await recordShiprocketOrder({ orderId: "ORD-1", shiprocketOrderId: "sr-999", raw: { status: "NEW" } });
    expect(db.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ shipRocket: { status: "NEW" } }),
      })
    );
  });
});
