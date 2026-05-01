import { NextResponse } from "next/server";
import { userSession } from "@/lib/session";
import { apiError } from "@/lib/api-error";
import { logger } from "@/lib/logger";
import { safeJson } from "@/lib/safe-json";

export const DIST_COOKIE = "dist_session";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/distributor",
  maxAge: userSession.accessExpirySeconds,
};

/** POST { token } — verify access token, check DISTRIBUTOR role, set httpOnly cookie */
export async function POST(req: Request) {
  try {
    const r = await safeJson(req, { maxBytes: 4096 });
    if (!r.ok) return r.response;
    const body = r.data as any;
    const token = typeof body?.token === "string" ? body.token : "";
    if (!token) return apiError("BAD_REQUEST", "token required");

    const payload = await userSession.verifyAccess(token);
    if (!payload?.userId) return apiError("UNAUTHORIZED", "Invalid or expired token");
    if (payload.role !== "DISTRIBUTOR") {
      return apiError("FORBIDDEN", "This portal is for distributors only");
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(DIST_COOKIE, token, COOKIE_OPTS);
    return res;
  } catch (error) {
    logger.error("[DIST_SESSION_POST]", error);
    return apiError("INTERNAL", "Failed to create session");
  }
}

/** DELETE — clear the distributor session cookie */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(DIST_COOKIE, "", { ...COOKIE_OPTS, maxAge: 0 });
  return res;
}
