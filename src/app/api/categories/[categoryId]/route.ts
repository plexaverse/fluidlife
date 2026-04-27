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
  { params }: { params: Promise<{ categoryId: string }> }
) {
  const headers = corsHeaders(req);
  try {
    const { categoryId } = await params;
    if (!categoryId) return apiError("BAD_REQUEST", "categoryId required", headers);

    const category = await prismadb.category.findUnique({
      where: { id: categoryId },
      include: { billboard: true },
    });
    if (!category) return apiError("NOT_FOUND", "Category not found", headers);
    return NextResponse.json(category, { headers });
  } catch (error) {
    logger.error("[CATEGORY_GET]", error);
    return apiError("INTERNAL", "Failed to fetch category", headers);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  const headers = corsHeaders(req);
  const auth = await requireAdmin();
  if (isResponse(auth)) return auth;

  try {
    const { categoryId } = await params;
    if (!categoryId) return apiError("BAD_REQUEST", "categoryId required", headers);

    const r = await safeJson(req, { headers });
    if (!r.ok) return r.response;
    const body = r.data as any;

    const data: { name?: string; billboardId?: string } = {};
    if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
    if (typeof body.billboardId === "string" && body.billboardId) data.billboardId = body.billboardId;
    if (Object.keys(data).length === 0) {
      return apiError("BAD_REQUEST", "No valid fields to update", headers);
    }

    try {
      const category = await prismadb.category.update({
        where: { id: categoryId },
        data,
        include: { billboard: true },
      });
      return NextResponse.json(category, { headers });
    } catch (e: any) {
      if (e?.code === "P2025") return apiError("NOT_FOUND", "Category not found", headers);
      if (e?.code === "P2003") return apiError("BAD_REQUEST", "Billboard does not exist", headers);
      throw e;
    }
  } catch (error) {
    logger.error("[CATEGORY_PATCH]", error);
    return apiError("INTERNAL", "Failed to update category", headers);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  const headers = corsHeaders(req);
  const auth = await requireAdmin();
  if (isResponse(auth)) return auth;

  try {
    const { categoryId } = await params;
    if (!categoryId) return apiError("BAD_REQUEST", "categoryId required", headers);

    // Block deletion if any product references this category — admin must reassign first.
    const productCount = await prismadb.product.count({ where: { categoryId } });
    if (productCount > 0) {
      return apiError(
        "CONFLICT",
        `Category has ${productCount} product(s); reassign or archive them first`,
        headers
      );
    }

    try {
      const category = await prismadb.category.delete({ where: { id: categoryId } });
      return NextResponse.json(category, { headers });
    } catch (e: any) {
      if (e?.code === "P2025") return apiError("NOT_FOUND", "Category not found", headers);
      throw e;
    }
  } catch (error) {
    logger.error("[CATEGORY_DELETE]", error);
    return apiError("INTERNAL", "Failed to delete category", headers);
  }
}
