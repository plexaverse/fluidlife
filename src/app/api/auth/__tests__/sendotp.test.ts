import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/ratelimit", () => ({
  enforceRateLimit: vi.fn().mockResolvedValue(null),
  rateLimits: { sendOtp: vi.fn().mockReturnValue(null) },
}));
vi.mock("@/lib/prismadb", () => ({
  default: { otp_sessions: { upsert: vi.fn().mockResolvedValue({}) } },
}));

import prismadb from "@/lib/prismadb";
import { POST } from "@/app/api/auth/sendotp/route";

const db = prismadb as any;

function makeReq(body: unknown) {
  return new Request("http://localhost/api/auth/sendotp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => vi.clearAllMocks());

describe("POST /api/auth/sendotp", () => {
  it("returns 400 for missing phone", async () => {
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid phone format", async () => {
    const res = await POST(makeReq({ phone: "abc" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for phone starting with 0", async () => {
    const res = await POST(makeReq({ phone: "0123456789" }));
    expect(res.status).toBe(400);
  });

  it("returns 500 when OTP provider request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    const res = await POST(makeReq({ phone: "9999999999" }));
    expect(res.status).toBe(500);
  });

  it("returns 500 when OTP provider returns non-Success status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ Status: "Failure", Details: "" }),
    }));
    const res = await POST(makeReq({ phone: "9999999999" }));
    expect(res.status).toBe(500);
  });

  it("upserts session and returns pending on success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ Status: "Success", Details: "session-abc" }),
    }));

    const res = await POST(makeReq({ phone: "9999999999" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("pending");

    expect(db.otp_sessions.upsert).toHaveBeenCalledOnce();
    const call = db.otp_sessions.upsert.mock.calls[0][0];
    expect(call.where.phone).toBe("9999999999");
    expect(call.create.sessionId).toBe("session-abc");
    expect(call.update.sessionId).toBe("session-abc");
  });

  it("encodes special characters in phone number in the API URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ Status: "Success", Details: "sid" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await POST(makeReq({ phone: "19995550100" }));
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain("19995550100");
  });
});
