import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/ratelimit", () => ({
  enforceRateLimit: vi.fn().mockResolvedValue(null),
  rateLimits: { verifyOtp: vi.fn().mockReturnValue(null) },
}));

const mockSession = {
  id: "sess-1",
  phone: "9999999999",
  sessionId: "sid-abc",
  expiresAt: new Date(Date.now() + 60_000),
  used: false,
};
const mockUser = { id: "user-1", phone: "9999999999", name: "Guest", email: "9999999999@placeholder.fluidlife.local", role: "CUSTOMER" };

vi.mock("@/lib/prismadb", () => ({
  default: {
    otp_sessions: { findUnique: vi.fn(), updateMany: vi.fn() },
    user: { upsert: vi.fn() },
  },
}));
vi.mock("@/lib/session", () => ({
  userSession: {
    signAccess: vi.fn().mockResolvedValue("access-token"),
    signRefresh: vi.fn().mockResolvedValue("refresh-token"),
    accessExpirySeconds: 900,
  },
}));

import prismadb from "@/lib/prismadb";
import { POST } from "@/app/api/auth/verifyotp/route";

const db = prismadb as any;

function makeReq(body: unknown) {
  return new Request("http://localhost/api/auth/verifyotp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  db.otp_sessions.findUnique.mockResolvedValue(mockSession);
  db.otp_sessions.updateMany.mockResolvedValue({ count: 1 });
  db.user.upsert.mockResolvedValue(mockUser);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ Status: "Success", Details: "OTP Matched" }),
  }));
});

describe("POST /api/auth/verifyotp", () => {
  it("returns 400 for missing phone", async () => {
    const res = await POST(makeReq({ code: "1234" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for missing OTP code", async () => {
    const res = await POST(makeReq({ phone: "9999999999" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for non-digit OTP", async () => {
    const res = await POST(makeReq({ phone: "9999999999", code: "abcd" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when no session exists", async () => {
    db.otp_sessions.findUnique.mockResolvedValue(null);
    const res = await POST(makeReq({ phone: "9999999999", code: "1234" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for expired session", async () => {
    db.otp_sessions.findUnique.mockResolvedValue({
      ...mockSession,
      expiresAt: new Date(Date.now() - 1000),
    });
    const res = await POST(makeReq({ phone: "9999999999", code: "1234" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for already-used session", async () => {
    db.otp_sessions.findUnique.mockResolvedValue({ ...mockSession, used: true });
    const res = await POST(makeReq({ phone: "9999999999", code: "1234" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when OTP provider says wrong code", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ Status: "Success", Details: "OTP Mismatch" }),
    }));
    const res = await POST(makeReq({ phone: "9999999999", code: "9999" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 if OTP consumed by concurrent request (count=0)", async () => {
    db.otp_sessions.updateMany.mockResolvedValue({ count: 0 });
    const res = await POST(makeReq({ phone: "9999999999", code: "1234" }));
    expect(res.status).toBe(400);
  });

  it("happy path: marks session used and returns tokens", async () => {
    const res = await POST(makeReq({ phone: "9999999999", code: "1234" }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.token).toBe("access-token");
    expect(body.refreshToken).toBe("refresh-token");
    expect(body.user.phone).toBe("9999999999");

    expect(db.otp_sessions.updateMany).toHaveBeenCalledWith({
      where: { id: "sess-1", used: false },
      data: { used: true },
    });
    expect(db.user.upsert).toHaveBeenCalledOnce();
  });

  it("upserts user with phone as identifier", async () => {
    await POST(makeReq({ phone: "9999999999", code: "1234" }));
    const call = db.user.upsert.mock.calls[0][0];
    expect(call.where.phone).toBe("9999999999");
  });
});
