import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { requireAdmin, isResponse } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { logger } from "@/lib/logger";
import { corsHeaders } from "@/lib/cors";
import { safeJson } from "@/lib/safe-json";

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ billboardId: string }> }
) {
  const headers = corsHeaders(req);
  try {
    const { billboardId } = await params;
    if (!billboardId) return apiError("BAD_REQUEST", "billboardId required", headers);

    const billboard = await prismadb.billboard.findUnique({ where: { id: billboardId } });
    if (!billboard) return apiError("NOT_FOUND", "Billboard not found", headers);
    return NextResponse.json(billboard, { headers });
  } catch (error) {
    logger.error("[BILLBOARD_GET]", error);
    return apiError("INTERNAL", "Failed to fetch billboard", headers);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ billboardId: string }> }
) {
  const headers = corsHeaders(req);
  const auth = await requireAdmin();
  if (isResponse(auth)) return auth;

  try {
    const { billboardId } = await params;
    if (!billboardId) return apiError("BAD_REQUEST", "billboardId required", headers);

    const r = await safeJson(req, { headers });
    if (!r.ok) return r.response;
    const body = r.data as any;

    const data: { label?: string; imageUrl?: string } = {};
    if (typeof body.label === "string" && body.label.trim()) data.label = body.label.trim();
    if (typeof body.imageUrl === "string" && body.imageUrl.trim()) data.imageUrl = body.imageUrl.trim();
    if (Object.keys(data).length === 0) {
      return apiError("BAD_REQUEST", "No valid fields to update", headers);
    }

    try {
      const billboard = await prismadb.billboard.update({ where: { id: billboardId }, data });
      return NextResponse.json(billboard, { headers });
    } catch (e: any) {
      if (e?.code === "P2025") return apiError("NOT_FOUND", "Billboard not found", headers);
      throw e;
    }
  } catch (error) {
    logger.error("[BILLBOARD_PATCH]", error);
    return apiError("INTERNAL", "Failed to update billboard", headers);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ billboardId: string }> }
) {
  const headers = corsHeaders(req);
  const auth = await requireAdmin();
  if (isResponse(auth)) return auth;

  try {
    const { billboardId } = await params;
    if (!billboardId) return apiError("BAD_REQUEST", "billboardId required", headers);

    const categoryCount = await prismadb.category.count({ where: { billboardId } });
    if (categoryCount > 0) {
      return apiError(
        "CONFLICT",
        `Billboard has ${categoryCount} category/categories; reassign first`,
        headers
      );
    }

    try {
      const billboard = await prismadb.billboard.delete({ where: { id: billboardId } });
      return NextResponse.json(billboard, { headers });
    } catch (e: any) {
      if (e?.code === "P2025") return apiError("NOT_FOUND", "Billboard not found", headers);
      throw e;
    }
  } catch (error) {
    logger.error("[BILLBOARD_DELETE]", error);
    return apiError("INTERNAL", "Failed to delete billboard", headers);
  }
}
