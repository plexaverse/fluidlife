import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { adminSession, userSession, ADMIN_COOKIE, type UserSessionPayload } from "./session";
import { apiError } from "./api-error";

export { ADMIN_COOKIE };

export async function requireAdmin(): Promise<NextResponse | { ok: true }> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return apiError("UNAUTHORIZED", "Admin authentication required");
  const payload = await adminSession.verify(token);
  if (!payload || payload.role !== "admin") {
    return apiError("UNAUTHORIZED", "Invalid admin session");
  }
  return { ok: true };
}

export async function requireUser(req: Request): Promise<NextResponse | UserSessionPayload> {
  const header = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    return apiError("UNAUTHORIZED", "Bearer token required");
  }
  const token = header.slice(7).trim();
  const payload = await userSession.verifyAccess(token);
  if (!payload || !payload.userId) {
    return apiError("UNAUTHORIZED", "Invalid or expired token");
  }
  return {
    userId: payload.userId,
    phone: payload.phone,
    role: payload.role,
  };
}

export function requireSelf(session: UserSessionPayload, targetUserId: string): NextResponse | null {
  if (session.role === "ADMIN") return null;
  if (session.userId !== targetUserId) {
    return apiError("FORBIDDEN", "You do not have access to this resource");
  }
  return null;
}

export type AuthContext =
  | { kind: "admin" }
  | { kind: "user"; user: UserSessionPayload };

export async function requireAdminOrSelf(
  req: Request,
  targetUserId: string
): Promise<NextResponse | AuthContext> {
  const adminToken = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (adminToken) {
    const a = await adminSession.verify(adminToken);
    if (a?.role === "admin") return { kind: "admin" };
  }
  const userResult = await requireUser(req);
  if (isResponse(userResult)) return userResult;
  if (userResult.userId !== targetUserId) {
    return apiError("FORBIDDEN", "You do not have access to this resource");
  }
  return { kind: "user", user: userResult };
}

export function isResponse(x: unknown): x is NextResponse {
  return x instanceof NextResponse;
}
