import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { requireAdmin, isResponse } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { logger } from "@/lib/logger";
import { corsHeaders } from "@/lib/cors";

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  const headers = corsHeaders(req);
  const auth = await requireAdmin();
  if (isResponse(auth)) return auth;

  try {
    const { reviewId } = await params;
    if (!reviewId) return apiError("BAD_REQUEST", "reviewId required", headers);

    try {
      const deleted = await prismadb.review.delete({ where: { id: reviewId } });
      return NextResponse.json(deleted, { headers });
    } catch (e: any) {
      if (e?.code === "P2025") return apiError("NOT_FOUND", "Review not found", headers);
      throw e;
    }
  } catch (error) {
    logger.error("[REVIEW_DELETE]", error);
    return apiError("INTERNAL", "Failed to delete review", headers);
  }
}
