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
  const session = await requireUser(req);
  if (isResponse(session)) return session;

  try {
    const { searchParams } = new URL(req.url);
    const take = Math.min(Math.max(parseInt(searchParams.get("take") || "50", 10) || 50, 1), 100);
    const skip = Math.max(parseInt(searchParams.get("skip") || "0", 10) || 0, 0);

    const wishlist = await prismadb.wishlistItem.findMany({
      where: { userId: session.userId },
      include: { product: { include: { images: { take: 1 } } } },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    });
    return NextResponse.json(wishlist, { headers });
  } catch (error) {
    logger.error("[WISHLIST_GET]", error);
    return apiError("INTERNAL", "Failed to fetch wishlist", headers);
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
    if (!productId) return apiError("BAD_REQUEST", "productId required", headers);

    try {
      const item = await prismadb.wishlistItem.create({
        data: { userId: session.userId, productId },
      });
      return NextResponse.json(item, { headers });
    } catch (e: any) {
      if (e?.code === "P2002") return apiError("CONFLICT", "Already in wishlist", headers);
      if (e?.code === "P2003") return apiError("BAD_REQUEST", "Product does not exist", headers);
      throw e;
    }
  } catch (error) {
    logger.error("[WISHLIST_POST]", error);
    return apiError("INTERNAL", "Failed to add to wishlist", headers);
  }
}

export async function DELETE(req: Request) {
  const headers = corsHeaders(req);
  const session = await requireUser(req);
  if (isResponse(session)) return session;

  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId") || "";
    if (!productId) return apiError("BAD_REQUEST", "productId required", headers);

    try {
      const deleted = await prismadb.wishlistItem.delete({
        where: { userId_productId: { userId: session.userId, productId } },
      });
      return NextResponse.json(deleted, { headers });
    } catch (e: any) {
      if (e?.code === "P2025") return apiError("NOT_FOUND", "Not in wishlist", headers);
      throw e;
    }
  } catch (error) {
    logger.error("[WISHLIST_DELETE]", error);
    return apiError("INTERNAL", "Failed to remove from wishlist", headers);
  }
}
