import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { requireAdmin, isResponse } from "@/lib/auth";
import { apiError, apiValidationError } from "@/lib/api-error";
import { logger } from "@/lib/logger";
import { corsHeaders } from "@/lib/cors";
import { safeJson } from "@/lib/safe-json";
import { productUpdateSchema } from "@/lib/schemas";

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const headers = corsHeaders(req);
  try {
    const { productId } = await params;
    if (!productId) return apiError("BAD_REQUEST", "Product id is required", headers);

    const product = await prismadb.product.findFirst({
      where: { id: productId, isArchived: false },
      include: { images: true, category: true, reviews: true },
    });
    if (!product) return apiError("NOT_FOUND", "Product not found", headers);

    return NextResponse.json(product, { headers });
  } catch (error) {
    logger.error("[PRODUCT_GET]", error);
    return apiError("INTERNAL", "Failed to fetch product", headers);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const headers = corsHeaders(req);
  const auth = await requireAdmin();
  if (isResponse(auth)) return auth;

  try {
    const { productId } = await params;
    if (!productId) return apiError("BAD_REQUEST", "Product id is required", headers);

    const r = await safeJson(req, { headers });
    if (!r.ok) return r.response;
    const parsed = productUpdateSchema.safeParse(r.data);
    if (!parsed.success) return apiValidationError(parsed.error, headers);
    const data = parsed.data;

    const product = await prismadb.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: {
          name: data.name,
          description: data.description ?? null,
          price: data.price,
          ...(data.originalPrice !== undefined && { originalPrice: data.originalPrice }),
          categoryId: data.categoryId,
          ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
          ...(data.isArchived !== undefined && { isArchived: data.isArchived }),
          ...(data.stock !== undefined && { stock: data.stock }),
          ...(data.gstRate !== undefined && { gstRate: data.gstRate }),
          ...(data.hsnCode !== undefined && { hsnCode: data.hsnCode || null }),
          ...(data.features !== undefined && { features: data.features }),
          ...(data.reasonsToBuy !== undefined && { reasonsToBuy: data.reasonsToBuy }),
          ...(data.idealFor !== undefined && { idealFor: data.idealFor }),
          images: { deleteMany: {} },
        },
      });
      return tx.product.update({
        where: { id: productId },
        data: { images: { createMany: { data: data.images } } },
        include: { images: true, category: true },
      });
    });

    return NextResponse.json(product, { headers });
  } catch (error: any) {
    if (error?.code === "P2025") return apiError("NOT_FOUND", "Product not found", headers);
    if (error?.code === "P2003") return apiError("BAD_REQUEST", "Category does not exist", headers);
    logger.error("[PRODUCT_PATCH]", error);
    return apiError("INTERNAL", "Failed to update product", headers);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const headers = corsHeaders(req);
  const auth = await requireAdmin();
  if (isResponse(auth)) return auth;

  try {
    const { productId } = await params;
    if (!productId) return apiError("BAD_REQUEST", "Product id is required", headers);

    const product = await prismadb.product.update({
      where: { id: productId },
      data: { isArchived: true },
    });
    return NextResponse.json(product, { headers });
  } catch (error: any) {
    if (error?.code === "P2025") return apiError("NOT_FOUND", "Product not found", headers);
    logger.error("[PRODUCT_DELETE]", error);
    return apiError("INTERNAL", "Failed to delete product", headers);
  }
}
