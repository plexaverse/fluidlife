import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { env } from "@/lib/env";
import { apiError } from "@/lib/api-error";
import { logger } from "@/lib/logger";
import { corsHeaders } from "@/lib/cors";
import { safeJson } from "@/lib/safe-json";
import { enforceRateLimit, rateLimits } from "@/lib/ratelimit";

const PHONE_REGEX = /^[1-9]\d{9,14}$/;
const OTP_TTL_MS = 60 * 1000;

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
    if (!PHONE_REGEX.test(phone)) {
      return apiError("BAD_REQUEST", "Valid phone number required (10-15 digits)", headers);
    }

    const limited = await enforceRateLimit(req, rateLimits.sendOtp(), phone, headers);
    if (limited) return limited;

    const apiUrl = `${env.TWO_FACTOR_BASE_URL}${env.TWO_FACTOR_AUTH_KEY}/SMS/${encodeURIComponent(phone)}/AUTOGEN/OTP1`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    let data: { Status?: string; Details?: string };
    try {
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });
      if (!response.ok) {
        return apiError("INTERNAL", "OTP provider error", headers);
      }
      data = await response.json();
    } finally {
      clearTimeout(timeout);
    }

    if (data.Status !== "Success" || !data.Details) {
      return apiError("INTERNAL", "Failed to send OTP", headers);
    }

    await prismadb.otp_sessions.upsert({
      where: { phone },
      create: {
        phone,
        sessionId: data.Details,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
        used: false,
      },
      update: {
        sessionId: data.Details,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
        used: false,
      },
    });

    return NextResponse.json({ status: "pending" }, { headers });
  } catch (error) {
    logger.error("[SENDOTP]", error);
    return apiError("INTERNAL", "Failed to send verification", headers);
  }
}
