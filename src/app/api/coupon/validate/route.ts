import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prismadb from "@/lib/prismadb";
import { apiError } from "@/lib/api-error";
import { logger } from "@/lib/logger";
import { corsHeaders } from "@/lib/cors";
import { safeJson } from "@/lib/safe-json";
import { enforceRateLimit, rateLimits } from "@/lib/ratelimit";

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function POST(req: Request) {
  const headers = corsHeaders(req);
  try {
    const limited = await enforceRateLimit(req, rateLimits.couponValidate(), undefined, headers);
    if (limited) return limited;

    const r = await safeJson(req, { headers, maxBytes: 4096 });
    if (!r.ok) return r.response;
    const body = r.data as any;
    const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";
    const orderTotal = Number(body?.orderTotal);
    if (!code || !Number.isFinite(orderTotal) || orderTotal < 0) {
      return apiError("BAD_REQUEST", "code and non-negative orderTotal required", headers);
    }

    const coupon = await prismadb.coupon.findUnique({ where: { code } });
    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ valid: false, errorMessage: "Invalid or inactive coupon" }, { headers });
    }
    const now = new Date();
    if (coupon.validFrom && now < coupon.validFrom) {
      return NextResponse.json({ valid: false, errorMessage: "Coupon not yet active" }, { headers });
    }
    if (coupon.validUntil && now > coupon.validUntil) {
      return NextResponse.json({ valid: false, errorMessage: "Coupon expired" }, { headers });
    }
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({ valid: false, errorMessage: "Coupon usage limit reached" }, { headers });
    }
    if (coupon.minOrderAmount && orderTotal < coupon.minOrderAmount) {
      return NextResponse.json(
        { valid: false, errorMessage: `Minimum order ₹${coupon.minOrderAmount} required` },
        { headers }
      );
    }

    let discount: Prisma.Decimal;
    if (coupon.discountType === "PERCENTAGE") {
      discount = new Prisma.Decimal(orderTotal).mul(coupon.discountValue).div(100);
      if (coupon.maxDiscount && discount.gt(coupon.maxDiscount)) {
        discount = new Prisma.Decimal(coupon.maxDiscount);
      }
    } else {
      discount = new Prisma.Decimal(coupon.discountValue);
    }
    if (discount.gt(orderTotal)) discount = new Prisma.Decimal(orderTotal);

    return NextResponse.json(
      {
        valid: true,
        couponCode: coupon.code,
        discountAmount: Number(discount.toFixed(2)),
        discountType: coupon.discountType,
      },
      { headers }
    );
  } catch (error) {
    logger.error("[COUPON_VALIDATE]", error);
    return apiError("INTERNAL", "Failed to validate coupon", headers);
  }
}
