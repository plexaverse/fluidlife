import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { requireAdminOrSelf, isResponse } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { logger } from "@/lib/logger";
import { corsHeaders } from "@/lib/cors";
import { safeJson } from "@/lib/safe-json";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function GET(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const headers = corsHeaders(req);
  const { userId } = await params;
  if (!userId) return apiError("BAD_REQUEST", "User ID is required", headers);

  const auth = await requireAdminOrSelf(req, userId);
  if (isResponse(auth)) return auth;

  try {
    const user = await prismadb.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: { addresses: true },
    });
    if (!user) return apiError("NOT_FOUND", "User not found", headers);
    return NextResponse.json(user, { headers });
  } catch (error) {
    logger.error("[USER_GET]", error);
    return apiError("INTERNAL", "Failed to fetch user", headers);
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const headers = corsHeaders(req);
  const { userId } = await params;
  if (!userId) return apiError("BAD_REQUEST", "User ID is required", headers);

  const auth = await requireAdminOrSelf(req, userId);
  if (isResponse(auth)) return auth;

  try {
    const r = await safeJson(req, { headers });
    if (!r.ok) return r.response;
    const body = r.data as any;

    const data: Record<string, unknown> = {};
    if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
    if (typeof body.email === "string") {
      if (!EMAIL_REGEX.test(body.email.trim())) return apiError("BAD_REQUEST", "Invalid email", headers);
      data.email = body.email.trim();
    }
    if (typeof body.companyName === "string") data.companyName = body.companyName.trim() || null;
    if (typeof body.gstNumber === "string") data.gstNumber = body.gstNumber.trim() || null;

    if (auth.kind === "admin") {
      if (typeof body.role === "string" && ["CUSTOMER", "DISTRIBUTOR", "ADMIN"].includes(body.role)) {
        data.role = body.role;
      }
      if (typeof body.isApproved === "boolean") {
        data.isApproved = body.isApproved;
      }
      if (body.creditLimit === null) {
        data.creditLimit = null;
      } else if (body.creditLimit !== undefined) {
        const n = Number(body.creditLimit);
        if (!Number.isFinite(n) || n < 0) {
          return apiError("BAD_REQUEST", "creditLimit must be >= 0 or null", headers);
        }
        data.creditLimit = n;
      }
    }

    if (Object.keys(data).length === 0) return apiError("BAD_REQUEST", "No valid fields to update", headers);

    const user = await prismadb.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        phone: true,
        name: true,
        email: true,
        role: true,
        companyName: true,
        gstNumber: true,
        isApproved: true,
        creditLimit: true,
        creditUsed: true,
      },
    });
    return NextResponse.json(user, { headers });
  } catch (error: any) {
    if (error?.code === "P2025") return apiError("NOT_FOUND", "User not found", headers);
    logger.error("[USER_PUT]", error);
    return apiError("INTERNAL", "Failed to update user", headers);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const headers = corsHeaders(req);
  const { userId } = await params;
  if (!userId) return apiError("BAD_REQUEST", "User ID is required", headers);

  const auth = await requireAdminOrSelf(req, userId);
  if (isResponse(auth)) return auth;

  try {
    const user = await prismadb.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
      select: { id: true, deletedAt: true },
    });
    return NextResponse.json(user, { headers });
  } catch (error: any) {
    if (error?.code === "P2025") return apiError("NOT_FOUND", "User not found", headers);
    logger.error("[USER_DELETE]", error);
    return apiError("INTERNAL", "Failed to delete user", headers);
  }
}
