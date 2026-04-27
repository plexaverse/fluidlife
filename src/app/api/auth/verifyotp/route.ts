import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { env } from "@/lib/env";
import { userSession, type UserRole } from "@/lib/session";
import { apiError } from "@/lib/api-error";
import { logger } from "@/lib/logger";
import { corsHeaders } from "@/lib/cors";
import { safeJson } from "@/lib/safe-json";
import { enforceRateLimit, rateLimits } from "@/lib/ratelimit";

const PHONE_REGEX = /^[1-9]\d{9,14}$/;
const OTP_REGEX = /^\d{4,8}$/;

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function POST(req: Request) {
  const headers = corsHeaders(req);
  try {
    const r = await safeJson(req, { headers, maxBytes: 1024 });
    if (!r.ok) return r.response;
    const body = r.data as any;
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    const code = typeof body?.code === "string" ? body.code.trim() : "";

    if (!PHONE_REGEX.test(phone)) {
      return apiError("BAD_REQUEST", "Invalid phone number", headers);
    }
    if (!OTP_REGEX.test(code)) {
      return apiError("BAD_REQUEST", "Invalid OTP code", headers);
    }

    const limited = await enforceRateLimit(req, rateLimits.verifyOtp(), phone, headers);
    if (limited) return limited;

    const otpSession = await prismadb.otp_sessions.findUnique({ where: { phone } });
    if (!otpSession || otpSession.used || otpSession.expiresAt <= new Date()) {
      return apiError("BAD_REQUEST", "OTP expired or invalid", headers);
    }

    const verifyUrl = `${env.TWO_FACTOR_BASE_URL}${env.TWO_FACTOR_AUTH_KEY}/SMS/VERIFY/${encodeURIComponent(otpSession.sessionId)}/${encodeURIComponent(code)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    let result: { Status?: string; Details?: string };
    try {
      const response = await fetch(verifyUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });
      if (!response.ok) {
        return apiError("BAD_REQUEST", "OTP verification failed", headers);
      }
      result = await response.json();
    } finally {
      clearTimeout(timeout);
    }

    if (result.Status !== "Success" || result.Details !== "OTP Matched") {
      return apiError("BAD_REQUEST", "Invalid OTP", headers);
    }

    const consumed = await prismadb.otp_sessions.updateMany({
      where: { id: otpSession.id, used: false },
      data: { used: true },
    });
    if (consumed.count === 0) {
      return apiError("BAD_REQUEST", "OTP already used", headers);
    }

    const user = await prismadb.user.upsert({
      where: { phone },
      create: {
        phone,
        name: "Guest",
        email: `${phone}@placeholder.fluidlife.local`,
      },
      update: {},
      select: { id: true, phone: true, name: true, email: true, role: true },
    });

    const sessionPayload = {
      userId: user.id,
      phone: user.phone,
      role: user.role as UserRole,
    };
    const [token, refreshToken] = await Promise.all([
      userSession.signAccess(sessionPayload),
      userSession.signRefresh(sessionPayload),
    ]);

    return NextResponse.json(
      {
        token,
        refreshToken,
        expiry: Math.floor(Date.now() / 1000) + userSession.accessExpirySeconds,
        user,
      },
      { headers }
    );
  } catch (error) {
    logger.error("[VERIFYOTP]", error);
    return apiError("INTERNAL", "Failed to verify OTP", headers);
  }
}
