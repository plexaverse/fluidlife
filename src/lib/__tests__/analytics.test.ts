import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

import { trackEvent } from "@/lib/analytics";

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.ANALYTICS_WEBHOOK_URL;
});

describe("trackEvent", () => {
  it("is a no-op when ANALYTICS_WEBHOOK_URL is not set", () => {
    vi.stubGlobal("fetch", vi.fn());
    trackEvent("order.created", { orderId: "ORD-1" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("POSTs to ANALYTICS_WEBHOOK_URL when configured", async () => {
    process.env.ANALYTICS_WEBHOOK_URL = "https://analytics.example.com/events";
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", mockFetch);

    trackEvent("order.paid", { orderId: "ORD-2", userId: "u-1", amount: "500.00" });

    // fire-and-forget: give the microtask queue a tick
    await new Promise((r) => setTimeout(r, 0));

    expect(mockFetch).toHaveBeenCalledWith(
      "https://analytics.example.com/events",
      expect.objectContaining({ method: "POST" })
    );
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.event).toBe("order.paid");
    expect(body.orderId).toBe("ORD-2");
    expect(body.timestamp).toMatch(/^\d{4}-/);
  });

  it("does not throw when fetch rejects", async () => {
    process.env.ANALYTICS_WEBHOOK_URL = "https://analytics.example.com/events";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));

    // Should not throw
    expect(() => trackEvent("order.refunded", { orderId: "ORD-3" })).not.toThrow();
    await new Promise((r) => setTimeout(r, 0));
  });

  it("includes all provided payload fields", async () => {
    process.env.ANALYTICS_WEBHOOK_URL = "https://a.example.com";
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", mockFetch);

    trackEvent("order.shipped", {
      orderId: "ORD-5",
      userId: "u-5",
      paymentType: "COD",
    });
    await new Promise((r) => setTimeout(r, 0));

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.event).toBe("order.shipped");
    expect(body.paymentType).toBe("COD");
  });
});
