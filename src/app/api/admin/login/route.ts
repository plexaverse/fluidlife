import { NextResponse } from "next/server";
import crypto from "crypto";
import { env } from "@/lib/env";
import { adminSession } from "@/lib/session";
import { ADMIN_COOKIE } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { logger } from "@/lib/logger";
import { safeJson } from "@/lib/safe-json";
import { enforceRateLimit, rateLimits } from "@/lib/ratelimit";

function safeEqualString(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export async function POST(req: Request) {
  try {
    const r = await safeJson(req, { maxBytes: 4096 });
    if (!r.ok) return r.response;
    const body = r.data as any;
    if (typeof body.username !== "string" || typeof body.password !== "string") {
      return apiError("BAD_REQUEST", "username and password are required");
    }

    const limited = await enforceRateLimit(req, rateLimits.adminLogin(), body.username);
    if (limited) return limited;

    const validUser = safeEqualString(body.username, env.ADMIN_USERNAME);
    const validPass = safeEqualString(body.password, env.ADMIN_PASSWORD);
    if (!validUser || !validPass) {
      return apiError("UNAUTHORIZED", "Invalid credentials");
    }

    const token = await adminSession.sign();
    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: adminSession.expirySeconds,
    });
    return response;
  } catch (error) {
    logger.error("[ADMIN_LOGIN]", error);
    return apiError("INTERNAL", "Login failed");
  }
}
