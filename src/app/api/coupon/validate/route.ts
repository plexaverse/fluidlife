import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() { return NextResponse.json({}, { headers: corsHeaders }); }

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { code, orderTotal } = body;

        if (!code || typeof orderTotal !== "number" || orderTotal < 0) {
            return NextResponse.json({ valid: false, discountAmount: 0, errorMessage: "Invalid input" }, { status: 400, headers: corsHeaders });
        }

        // Validate strictly using the centralized Coupon DB model (Fix #3 implementation)
        const coupon = await prismadb.coupon.findUnique({
            where: { code: code.toUpperCase() }
        });

        if (!coupon || !coupon.isActive) {
            return NextResponse.json({ valid: false, discountAmount: 0, errorMessage: "Invalid or expired coupon" }, { headers: corsHeaders });
        }

        if (coupon.validFrom && new Date() < coupon.validFrom) {
            return NextResponse.json({ valid: false, discountAmount: 0, errorMessage: "Coupon not yet active" }, { headers: corsHeaders });
        }
        if (coupon.validUntil && new Date() > coupon.validUntil) {
            return NextResponse.json({ valid: false, discountAmount: 0, errorMessage: "Coupon expired" }, { headers: corsHeaders });
        }
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return NextResponse.json({ valid: false, discountAmount: 0, errorMessage: "Coupon usage limit reached" }, { headers: corsHeaders });
        }
        if (coupon.minOrderAmount && orderTotal < coupon.minOrderAmount) {
            return NextResponse.json({ valid: false, discountAmount: 0, errorMessage: `Minimum order value of ₹${coupon.minOrderAmount} required` }, { headers: corsHeaders });
        }

        let discountAmount = 0;
        if (coupon.discountType === 'PERCENTAGE') {
            discountAmount = (orderTotal * coupon.discountValue) / 100;
            if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
                discountAmount = coupon.maxDiscount;
            }
        } else if (coupon.discountType === 'FIXED') {
            discountAmount = coupon.discountValue;
        }

        return NextResponse.json({
            valid: true,
            couponId: coupon.id,
            discountAmount: Math.round(discountAmount * 100) / 100,
            discountType: coupon.discountType,
        }, { headers: corsHeaders });

    } catch (error) {
        console.error("[COUPON_VALIDATE_ERROR]", error);
        return NextResponse.json({ valid: false, discountAmount: 0, errorMessage: "Failed to validate coupon" }, { status: 500, headers: corsHeaders });
    }
}
