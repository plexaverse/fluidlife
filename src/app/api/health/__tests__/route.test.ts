import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prismadb", () => ({
  default: { $queryRaw: vi.fn() },
}));

import prismadb from "@/lib/prismadb";
import { GET } from "@/app/api/health/route";

const db = prismadb as any;

const REQUIRED_ENV = [
  "JWT_SECRET",
  "ADMIN_USERNAME",
  "ADMIN_PASSWORD",
  "USER_ACCESS_SECRET",
  "USER_REFRESH_SECRET",
  "TWO_FACTOR_BASE_URL",
  "TWO_FACTOR_AUTH_KEY",
  "RAZORPAY_WEBHOOK_SECRET",
  "SHIPROCKET_WEBHOOK_TOKEN",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];

function setAllEnv() {
  for (const k of REQUIRED_ENV) process.env[k] = "test-value";
}

function clearAllEnv() {
  for (const k of REQUIRED_ENV) delete process.env[k];
}

beforeEach(() => {
  vi.clearAllMocks();
  db.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);
  setAllEnv();
});

describe("GET /api/health", () => {
  it("returns 200 with status ok when DB and env are healthy", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("ok");
    expect(json.db).toBe("ok");
    expect(json.uptimeSeconds).toBeTypeOf("number");
  });

  it("returns 503 when DB query fails", async () => {
    db.$queryRaw.mockRejectedValue(new Error("connection refused"));
    const res = await GET();
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.status).toBe("degraded");
    expect(json.db).toBe("error");
  });

  it("returns 503 and lists missing env vars", async () => {
    clearAllEnv();
    const res = await GET();
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.status).toBe("degraded");
    expect(json.missingEnv).toEqual(expect.arrayContaining(["JWT_SECRET", "SUPABASE_URL"]));
  });

  it("returns 503 when a single required env is missing", async () => {
    delete process.env.JWT_SECRET;
    const res = await GET();
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.missingEnv).toContain("JWT_SECRET");
  });

  it("does not include missingEnv key when all env vars are present", async () => {
    const res = await GET();
    const json = await res.json();
    expect(json.missingEnv).toBeUndefined();
  });
});
