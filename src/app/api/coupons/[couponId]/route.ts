import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ couponId: string }> }
) {
  try {
    const { couponId } = await params;

    if (!couponId) {
      return new NextResponse("Coupon id is required", { status: 400 });
    }

    const coupon = await prismadb.coupon.findUnique({
      where: {
        id: couponId
      }
    });
  
    return NextResponse.json(coupon);
  } catch (error) {
    console.log('[COUPON_GET]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ couponId: string }> }
) {
  try {
    const { couponId } = await params;

    if (!couponId) {
      return new NextResponse("Coupon id is required", { status: 400 });
    }

    const coupon = await prismadb.coupon.delete({
      where: {
        id: couponId
      }
    });
  
    return NextResponse.json(coupon);
  } catch (error) {
    console.log('[COUPON_DELETE]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ couponId: string }> }
) {
  try {
    const { couponId } = await params;
    const body = await req.json();

    const { 
      code, discountType, discountValue, minOrderAmount, 
      maxDiscount, usageLimit, validFrom, validUntil, isActive 
    } = body;

    if (!couponId) {
      return new NextResponse("Coupon id is required", { status: 400 });
    }

    if (!code) {
      return new NextResponse("Code is required", { status: 400 });
    }

    if (discountValue === undefined) {
      return new NextResponse("Discount value is required", { status: 400 });
    }

    if (!validFrom || !validUntil) {
      return new NextResponse("Valid dates are required", { status: 400 });
    }

    const coupon = await prismadb.coupon.update({
      where: {
        id: couponId
      },
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
    console.log('[COUPON_PATCH]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
