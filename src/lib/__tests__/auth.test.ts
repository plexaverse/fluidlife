import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("./session", () => ({})); // not used directly; session is mocked below
vi.mock("@/lib/session", () => ({
  adminSession: { verify: vi.fn() },
  userSession: { verifyAccess: vi.fn() },
  ADMIN_COOKIE: "admin_session",
}));

import { cookies } from "next/headers";
import { adminSession, userSession } from "@/lib/session";
import { requireAdmin, requireUser, requireSelf, requireAdminOrSelf, isResponse } from "@/lib/auth";

const mockCookies = cookies as ReturnType<typeof vi.fn>;
const mockAdminVerify = adminSession.verify as ReturnType<typeof vi.fn>;
const mockUserVerify = userSession.verifyAccess as ReturnType<typeof vi.fn>;

function makeReq(token?: string) {
  return new Request("http://localhost/test", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

function adminCookieJar(token?: string) {
  return { get: (name: string) => (name === "admin_session" && token ? { value: token } : undefined) };
}

beforeEach(() => vi.clearAllMocks());

// ── requireAdmin ─────────────────────────────────────────────────────────────

describe("requireAdmin", () => {
  it("returns 401 when no cookie", async () => {
    mockCookies.mockResolvedValue(adminCookieJar());
    const res = await requireAdmin();
    expect(isResponse(res)).toBe(true);
    expect((res as Response).status).toBe(401);
  });

  it("returns 401 when cookie token is invalid", async () => {
    mockCookies.mockResolvedValue(adminCookieJar("bad-token"));
    mockAdminVerify.mockResolvedValue(null);
    const res = await requireAdmin();
    expect(isResponse(res)).toBe(true);
    expect((res as Response).status).toBe(401);
  });

  it("returns 401 when role is not admin", async () => {
    mockCookies.mockResolvedValue(adminCookieJar("tok"));
    mockAdminVerify.mockResolvedValue({ role: "user" });
    const res = await requireAdmin();
    expect(isResponse(res)).toBe(true);
    expect((res as Response).status).toBe(401);
  });

  it("returns { ok: true } for valid admin session", async () => {
    mockCookies.mockResolvedValue(adminCookieJar("tok"));
    mockAdminVerify.mockResolvedValue({ role: "admin" });
    const res = await requireAdmin();
    expect(res).toEqual({ ok: true });
  });
});

// ── requireUser ──────────────────────────────────────────────────────────────

describe("requireUser", () => {
  it("returns 401 when Authorization header missing", async () => {
    const res = await requireUser(makeReq());
    expect(isResponse(res)).toBe(true);
    expect((res as Response).status).toBe(401);
  });

  it("returns 401 for non-Bearer scheme", async () => {
    const req = new Request("http://localhost/test", {
      headers: { Authorization: "Basic abc" },
    });
    const res = await requireUser(req);
    expect(isResponse(res)).toBe(true);
    expect((res as Response).status).toBe(401);
  });

  it("returns 401 for invalid/expired token", async () => {
    mockUserVerify.mockResolvedValue(null);
    const res = await requireUser(makeReq("bad-token"));
    expect(isResponse(res)).toBe(true);
    expect((res as Response).status).toBe(401);
  });

  it("returns session payload for valid token", async () => {
    mockUserVerify.mockResolvedValue({ userId: "u-1", phone: "9999999999", role: "CUSTOMER" });
    const res = await requireUser(makeReq("good-token"));
    expect(isResponse(res)).toBe(false);
    expect(res).toMatchObject({ userId: "u-1", phone: "9999999999", role: "CUSTOMER" });
  });
});

// ── requireSelf ──────────────────────────────────────────────────────────────

describe("requireSelf", () => {
  it("returns null for ADMIN role regardless of userId", () => {
    const res = requireSelf({ userId: "u-1", phone: "1", role: "ADMIN" }, "u-99");
    expect(res).toBeNull();
  });

  it("returns null when userId matches target", () => {
    const res = requireSelf({ userId: "u-1", phone: "1", role: "CUSTOMER" }, "u-1");
    expect(res).toBeNull();
  });

  it("returns 403 when userId does not match target", () => {
    const res = requireSelf({ userId: "u-1", phone: "1", role: "CUSTOMER" }, "u-2");
    expect(isResponse(res)).toBe(true);
    expect((res as Response).status).toBe(403);
  });
});

// ── requireAdminOrSelf ───────────────────────────────────────────────────────

describe("requireAdminOrSelf", () => {
  it("returns { kind: 'admin' } when valid admin cookie present", async () => {
    mockCookies.mockResolvedValue(adminCookieJar("admin-tok"));
    mockAdminVerify.mockResolvedValue({ role: "admin" });
    const res = await requireAdminOrSelf(makeReq(), "u-1");
    expect(res).toEqual({ kind: "admin" });
  });

  it("falls through to user check when admin cookie is invalid", async () => {
    mockCookies.mockResolvedValue(adminCookieJar("bad-tok"));
    mockAdminVerify.mockResolvedValue(null);
    mockUserVerify.mockResolvedValue({ userId: "u-1", phone: "9", role: "CUSTOMER" });
    const res = await requireAdminOrSelf(makeReq("user-tok"), "u-1");
    expect(isResponse(res)).toBe(false);
    expect((res as any).kind).toBe("user");
  });

  it("returns { kind: 'user' } when user accesses own resource", async () => {
    mockCookies.mockResolvedValue(adminCookieJar());
    mockUserVerify.mockResolvedValue({ userId: "u-1", phone: "9", role: "CUSTOMER" });
    const res = await requireAdminOrSelf(makeReq("user-tok"), "u-1");
    expect((res as any).kind).toBe("user");
    expect((res as any).user.userId).toBe("u-1");
  });

  it("returns 403 when user accesses another user's resource", async () => {
    mockCookies.mockResolvedValue(adminCookieJar());
    mockUserVerify.mockResolvedValue({ userId: "u-1", phone: "9", role: "CUSTOMER" });
    const res = await requireAdminOrSelf(makeReq("user-tok"), "u-99");
    expect(isResponse(res)).toBe(true);
    expect((res as Response).status).toBe(403);
  });

  it("returns 401 when no auth at all", async () => {
    mockCookies.mockResolvedValue(adminCookieJar());
    mockUserVerify.mockResolvedValue(null);
    const res = await requireAdminOrSelf(makeReq("bad"), "u-1");
    expect(isResponse(res)).toBe(true);
    expect((res as Response).status).toBe(401);
  });
});
