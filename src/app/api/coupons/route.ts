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

export async function POST(req: Request) {
  const headers = corsHeaders(req);
  const auth = await requireAdmin();
  if (isResponse(auth)) return auth;

  try {
    const r = await safeJson(req, { headers });
    if (!r.ok) return r.response;
    const parsed = couponSchema.safeParse(r.data);
    if (!parsed.success) return apiValidationError(parsed.error, headers);
    const data = parsed.data;

    try {
      const coupon = await prismadb.coupon.create({
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
      throw e;
    }
  } catch (error) {
    logger.error("[COUPONS_POST]", error);
    return apiError("INTERNAL", "Failed to create coupon", headers);
  }
}

export async function GET(req: Request) {
  const headers = corsHeaders(req);
  const auth = await requireAdmin();
  if (isResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const take = Math.min(Math.max(parseInt(searchParams.get("take") || "50", 10) || 50, 1), 100);
    const skip = Math.max(parseInt(searchParams.get("skip") || "0", 10) || 0, 0);

    const coupons = await prismadb.coupon.findMany({
      orderBy: { createdAt: "desc" },
      take,
      skip,
    });
    return NextResponse.json(coupons, { headers });
  } catch (error) {
    logger.error("[COUPONS_GET]", error);
    return apiError("INTERNAL", "Failed to fetch coupons", headers);
  }
}
