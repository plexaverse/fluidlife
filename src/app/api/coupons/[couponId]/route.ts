import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { requireAdmin, isResponse } from "@/lib/auth";
import { apiError, apiValidationError } from "@/lib/api-error";
import { logger } from "@/lib/logger";
import { corsHeaders } from "@/lib/cors";
import { safeJson } from "@/lib/safe-json";
import { couponSchema } from "@/lib/schemas";

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ couponId: string }> }
) {
  const headers = corsHeaders(req);
  const auth = await requireAdmin();
  if (isResponse(auth)) return auth;

  try {
    const { couponId } = await params;
    if (!couponId) return apiError("BAD_REQUEST", "Coupon id is required", headers);

    const coupon = await prismadb.coupon.findUnique({ where: { id: couponId } });
    if (!coupon) return apiError("NOT_FOUND", "Coupon not found", headers);
    return NextResponse.json(coupon, { headers });
  } catch (error) {
    logger.error("[COUPON_GET]", error);
    return apiError("INTERNAL", "Failed to fetch coupon", headers);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ couponId: string }> }
) {
  const headers = corsHeaders(req);
  const auth = await requireAdmin();
  if (isResponse(auth)) return auth;

  try {
    const { couponId } = await params;
    if (!couponId) return apiError("BAD_REQUEST", "Coupon id is required", headers);

    const coupon = await prismadb.coupon.delete({ where: { id: couponId } });
    return NextResponse.json(coupon, { headers });
  } catch (error: any) {
    if (error?.code === "P2025") return apiError("NOT_FOUND", "Coupon not found", headers);
    logger.error("[COUPON_DELETE]", error);
    return apiError("INTERNAL", "Failed to delete coupon", headers);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ couponId: string }> }
) {
  const headers = corsHeaders(req);
  const auth = await requireAdmin();
  if (isResponse(auth)) return auth;

  try {
    const { couponId } = await params;
    if (!couponId) return apiError("BAD_REQUEST", "Coupon id is required", headers);

    const r = await safeJson(req, { headers });
    if (!r.ok) return r.response;
    const parsed = couponSchema.safeParse(r.data);
    if (!parsed.success) return apiValidationError(parsed.error, headers);
    const data = parsed.data;

    try {
      const coupon = await prismadb.coupon.update({
        where: { id: couponId },
        data: {
          code: data.code,
          discountType: data.discountType,
          discountValue: data.discountValue,
          minOrderAmount: data.minOrderAmount ?? null,
          maxDiscount: data.maxDiscount ?? null,
          usageLimit: data.usageLimit ?? null,
          validFrom: data.validFrom,
          validUntil: data.validUntil,
          isActive: data.isActive,
        },
      });
      return NextResponse.json(coupon, { headers });
    } catch (e: any) {
      if (e?.code === "P2002") return apiError("CONFLICT", "Coupon code already exists", headers);
      if (e?.code === "P2025") return apiError("NOT_FOUND", "Coupon not found", headers);
      throw e;
    }
  } catch (error) {
    logger.error("[COUPON_PATCH]", error);
    return apiError("INTERNAL", "Failed to update coupon", headers);
  }
}
