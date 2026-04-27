import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { userSession, type UserRole } from "@/lib/session";
import { apiError } from "@/lib/api-error";
import { logger } from "@/lib/logger";
import { corsHeaders } from "@/lib/cors";
import { safeJson } from "@/lib/safe-json";

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function POST(req: Request) {
  const headers = corsHeaders(req);
  try {
    const r = await safeJson(req, { headers, maxBytes: 4096 });
    if (!r.ok) return r.response;
    const body = r.data as any;
    const refreshToken = typeof body?.refreshToken === "string" ? body.refreshToken : "";
    if (!refreshToken) return apiError("BAD_REQUEST", "refreshToken required", headers);

    const payload = await userSession.verifyRefresh(refreshToken);
    if (!payload?.userId) return apiError("UNAUTHORIZED", "Invalid refresh token", headers);

    const user = await prismadb.user.findFirst({
      where: { id: payload.userId, deletedAt: null },
      select: { id: true, phone: true, role: true },
    });
    if (!user) return apiError("UNAUTHORIZED", "User no longer exists", headers);

    const sessionPayload = { userId: user.id, phone: user.phone, role: user.role as UserRole };
    const token = await userSession.signAccess(sessionPayload);

    return NextResponse.json(
      {
        token,
        expiry: Math.floor(Date.now() / 1000) + userSession.accessExpirySeconds,
      },
      { headers }
    );
  } catch (error) {
    logger.error("[AUTH_REFRESH]", error);
    return apiError("INTERNAL", "Failed to refresh token", headers);
  }
}
