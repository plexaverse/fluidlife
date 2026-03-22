import { NextResponse } from 'next/server';
import prismadb from '@/lib/prismadb';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { 
      code, discountType, discountValue, minOrderAmount, 
      maxDiscount, usageLimit, validFrom, validUntil, isActive 
    } = body;

    if (!code) {
      return new NextResponse("Code is required", { status: 400 });
    }

    if (discountValue === undefined) {
      return new NextResponse("Discount value is required", { status: 400 });
    }

    if (!validFrom || !validUntil) {
      return new NextResponse("Valid dates are required", { status: 400 });
    }

    const existingCoupon = await prismadb.coupon.findUnique({
      where: { code }
    });

    if (existingCoupon) {
      return new NextResponse("Coupon code already exists", { status: 400 });
    }

    const coupon = await prismadb.coupon.create({
      data: {
        code,
        discountType,
        discountValue,
        minOrderAmount,
        maxDiscount,
        usageLimit,
        validFrom,
        validUntil,
        isActive,
      }
    });
  
    return NextResponse.json(coupon);
  } catch (error) {
    console.log('[COUPONS_POST]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const coupons = await prismadb.coupon.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
  
    return NextResponse.json(coupons);
  } catch (error) {
    console.log('[COUPONS_GET]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
