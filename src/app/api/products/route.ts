import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { requireAdmin, isResponse } from "@/lib/auth";
import { apiError, apiValidationError } from "@/lib/api-error";
import { logger } from "@/lib/logger";
import { corsHeaders } from "@/lib/cors";
import { safeJson } from "@/lib/safe-json";
import { productCreateSchema } from "@/lib/schemas";

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function POST(req: Request) {
  const headers = corsHeaders(req);
  const auth = await requireAdmin();
  if (isResponse(auth)) return auth;

  try {
    const r = await safeJson(req, { headers });
    if (!r.ok) return r.response;
    const parsed = productCreateSchema.safeParse(r.data);
    if (!parsed.success) return apiValidationError(parsed.error, headers);
    const data = parsed.data;

    try {
      const product = await prismadb.product.create({
        data: {
          categoryId: data.categoryId,
          name: data.name,
          description: data.description ?? null,
          features: data.features,
          benefits: data.benefits,
          usage: data.usage,
          idealFor: data.idealFor,
          reasonsToBuy: data.reasonsToBuy,
          greenDiscounts: data.greenDiscounts,
          sustainable: data.sustainable,
          faq: data.faq as any,
          certifications: data.certifications,
          price: data.price,
          ...(data.b2bPrice && { b2bPrice: data.b2bPrice }),
          moq: data.moq,
          originalPrice: data.originalPrice,
          deliveryPrice: data.deliveryPrice,
          stock: data.stock,
          gstRate: data.gstRate,
          ...(data.hsnCode && { hsnCode: data.hsnCode }),
          isFeatured: data.isFeatured,
          isArchived: data.isArchived,
          length: data.length,
          breadth: data.breadth,
          height: data.height,
          weight: data.weight,
          images: { create: data.images },
        },
        include: {
          images: true,
          category: { include: { billboard: true } },
        },
      });
      return NextResponse.json(product, { headers });
    } catch (e: any) {
      if (e?.code === "P2003") return apiError("BAD_REQUEST", "Category does not exist", headers);
      throw e;
    }
  } catch (error) {
    logger.error("[PRODUCTS_POST]", error);
    return apiError("INTERNAL", "Failed to create product", headers);
  }
}

export async function GET(req: Request) {
  const headers = corsHeaders(req);
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId") || undefined;
    const isFeatured = searchParams.get("isFeatured") === "true" ? true : undefined;
    const q = (searchParams.get("q") || "").trim().slice(0, 100);
    const take = Math.min(Math.max(parseInt(searchParams.get("take") || "50", 10) || 50, 1), 100);
    const skip = Math.max(parseInt(searchParams.get("skip") || "0", 10) || 0, 0);

    // Full-text search via PostgreSQL plainto_tsquery (no special operators
    // exposed — safe against any user input). Falls back to a substring match
    // for short queries where FTS is overkill.
    let textFilter: any = undefined;
    if (q.length >= 2) {
      if (q.length < 3) {
        textFilter = {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        };
      } else {
        textFilter = {
          OR: [
            { name: { search: q.split(/\s+/).filter(Boolean).join(" & ") } },
            { description: { search: q.split(/\s+/).filter(Boolean).join(" & ") } },
          ],
        };
      }
    }

    const where: any = { categoryId, isFeatured, isArchived: false };
    if (textFilter) Object.assign(where, textFilter);

    const products = await prismadb.product.findMany({
      where,
      include: {
        images: true,
        category: true,
        _count: { select: { reviews: true } },
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    });

    const productIds = products.map((p) => p.id);
    let ratingMap = new Map<string, number | null>();
    if (productIds.length > 0) {
      const aggregations = await prismadb.review.groupBy({
        by: ["productId"],
        where: { productId: { in: productIds } },
        _avg: { rating: true },
      });
      ratingMap = new Map(aggregations.map((a) => [a.productId, a._avg.rating]));
    }

    const output = products.map((product) => ({
      ...product,
      averageRating: +Number(ratingMap.get(product.id) ?? 0).toFixed(2),
      totalReviews: product._count.reviews,
    }));

    return NextResponse.json(output, { headers });
  } catch (error) {
    logger.error("[PRODUCTS_GET]", error);
    return apiError("INTERNAL", "Failed to fetch products", headers);
  }
}
