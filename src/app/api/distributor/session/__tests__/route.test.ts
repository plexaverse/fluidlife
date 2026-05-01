import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/session", () => ({
  userSession: { verifyAccess: vi.fn(), accessExpirySeconds: 900 },
}));

import { userSession } from "@/lib/session";
import { POST, DELETE } from "@/app/api/distributor/session/route";

const mockVerify = userSession.verifyAccess as ReturnType<typeof vi.fn>;

function makeReq(body: unknown) {
  return new Request("http://localhost/api/distributor/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.USER_ACCESS_SECRET = "test-secret";
});

describe("POST /api/distributor/session", () => {
  it("returns 400 when token is missing", async () => {
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
  });

  it("returns 401 for invalid token", async () => {
    mockVerify.mockResolvedValue(null);
    const res = await POST(makeReq({ token: "bad-token" }));
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-DISTRIBUTOR role", async () => {
    mockVerify.mockResolvedValue({ userId: "u-1", phone: "9999999999", role: "CUSTOMER" });
    const res = await POST(makeReq({ token: "cust-token" }));
    expect(res.status).toBe(403);
  });

  it("sets dist_session cookie for DISTRIBUTOR role", async () => {
    mockVerify.mockResolvedValue({ userId: "u-1", phone: "9999999999", role: "DISTRIBUTOR" });
    const res = await POST(makeReq({ token: "dist-token" }));
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("dist_session=dist-token");
    expect(setCookie).toContain("HttpOnly");
  });
});

describe("DELETE /api/distributor/session", () => {
  it("clears the dist_session cookie", async () => {
    const res = await DELETE();
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("dist_session=");
    expect(setCookie).toContain("Max-Age=0");
  });
});
