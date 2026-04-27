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

export async function GET(req: Request) {
  const headers = corsHeaders(req);
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId") || "";
    const take = Math.min(Math.max(parseInt(searchParams.get("take") || "50", 10) || 50, 1), 100);
    const skip = Math.max(parseInt(searchParams.get("skip") || "0", 10) || 0, 0);
    if (!productId) return apiError("BAD_REQUEST", "productId required", headers);

    const reviews = await prismadb.review.findMany({
      where: { productId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    });
    return NextResponse.json(reviews, { headers });
  } catch (error) {
    logger.error("[REVIEWS_GET]", error);
    return apiError("INTERNAL", "Failed to fetch reviews", headers);
  }
}

export async function POST(req: Request) {
  const headers = corsHeaders(req);
  const session = await requireUser(req);
  if (isResponse(session)) return session;

  try {
    const r = await safeJson(req, { headers });
    if (!r.ok) return r.response;
    const body = r.data as any;
    const productId = typeof body?.productId === "string" ? body.productId : "";
    const rating = Number(body?.rating);
    const comment = typeof body?.comment === "string" ? body.comment.trim().slice(0, 2000) : null;

    if (!productId) return apiError("BAD_REQUEST", "productId required", headers);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return apiError("BAD_REQUEST", "rating must be an integer 1-5", headers);
    }

    const purchased = await prismadb.orderItem.findFirst({
      where: {
        productId,
        order: { userId: session.userId, status: { in: ["DELIVERED", "SHIPPED"] } },
      },
      select: { id: true },
    });
    if (!purchased) {
      return apiError("FORBIDDEN", "You can only review products you have purchased", headers);
    }

    try {
      const review = await prismadb.review.create({
        data: { productId, userId: session.userId, rating, comment },
      });
      return NextResponse.json(review, { headers });
    } catch (e: any) {
      if (e?.code === "P2002") return apiError("CONFLICT", "You have already reviewed this product", headers);
      if (e?.code === "P2003") return apiError("BAD_REQUEST", "Product does not exist", headers);
      throw e;
    }
  } catch (error) {
    logger.error("[REVIEWS_POST]", error);
    return apiError("INTERNAL", "Failed to create review", headers);
  }
}
