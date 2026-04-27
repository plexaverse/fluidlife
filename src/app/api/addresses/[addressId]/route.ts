import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { requireUser, isResponse } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { logger } from "@/lib/logger";
import { corsHeaders } from "@/lib/cors";
import { safeJson } from "@/lib/safe-json";

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ addressId: string }> }
) {
  const headers = corsHeaders(req);
  const session = await requireUser(req);
  if (isResponse(session)) return session;

  try {
    const { addressId } = await params;
    if (!addressId) return apiError("BAD_REQUEST", "addressId required", headers);

    const address = await prismadb.address.findUnique({ where: { id: addressId } });
    if (!address) return apiError("NOT_FOUND", "Address not found", headers);
    if (address.userId !== session.userId && session.role !== "ADMIN") {
      return apiError("FORBIDDEN", "Not your address", headers);
    }
    return NextResponse.json(address, { headers });
  } catch (error) {
    logger.error("[ADDRESS_GET]", error);
    return apiError("INTERNAL", "Failed to fetch address", headers);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ addressId: string }> }
) {
  const headers = corsHeaders(req);
  const session = await requireUser(req);
  if (isResponse(session)) return session;

  try {
    const { addressId } = await params;
    if (!addressId) return apiError("BAD_REQUEST", "addressId required", headers);

    const existing = await prismadb.address.findUnique({
      where: { id: addressId },
      select: { userId: true },
    });
    if (!existing) return apiError("NOT_FOUND", "Address not found", headers);
    if (existing.userId !== session.userId && session.role !== "ADMIN") {
      return apiError("FORBIDDEN", "Not your address", headers);
    }

    const r = await safeJson(req, { headers });
    if (!r.ok) return r.response;
    const body = r.data as any;

    const data: Record<string, unknown> = {};
    const stringFields = ["address1", "address2", "city", "pincode", "landmark", "state", "country"];
    for (const f of stringFields) {
      if (typeof body[f] === "string") data[f] = body[f].trim();
    }
    if (typeof body.isDefault === "boolean") data.isDefault = body.isDefault;
    if (Object.keys(data).length === 0) {
      return apiError("BAD_REQUEST", "No valid fields to update", headers);
    }

    const address = await prismadb.address.update({ where: { id: addressId }, data });
    return NextResponse.json(address, { headers });
  } catch (error: any) {
    if (error?.code === "P2025") return apiError("NOT_FOUND", "Address not found", headers);
    logger.error("[ADDRESS_PATCH]", error);
    return apiError("INTERNAL", "Failed to update address", headers);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ addressId: string }> }
) {
  const headers = corsHeaders(req);
  const session = await requireUser(req);
  if (isResponse(session)) return session;

  try {
    const { addressId } = await params;
    if (!addressId) return apiError("BAD_REQUEST", "addressId required", headers);

    const existing = await prismadb.address.findUnique({
      where: { id: addressId },
      select: { userId: true },
    });
    if (!existing) return apiError("NOT_FOUND", "Address not found", headers);
    if (existing.userId !== session.userId && session.role !== "ADMIN") {
      return apiError("FORBIDDEN", "Not your address", headers);
    }

    // Block deletion if any non-deleted order references this address.
    const orderCount = await prismadb.order.count({
      where: { addressId, deletedAt: null },
    });
    if (orderCount > 0) {
      return apiError(
        "CONFLICT",
        "Address is in use by an active order; cannot delete",
        headers
      );
    }

    try {
      const deleted = await prismadb.address.delete({ where: { id: addressId } });
      return NextResponse.json(deleted, { headers });
    } catch (e: any) {
      if (e?.code === "P2025") return apiError("NOT_FOUND", "Address not found", headers);
      throw e;
    }
  } catch (error) {
    logger.error("[ADDRESS_DELETE]", error);
    return apiError("INTERNAL", "Failed to delete address", headers);
  }
}
