import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() { return NextResponse.json({}, { headers: corsHeaders }); }

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const take = Math.min(parseInt(searchParams.get('take') || '50'), 100);
    const skip = parseInt(searchParams.get('skip') || '0');

    if (!productId) return new NextResponse("Product ID required", { status: 400 });

    const reviews = await prismadb.review.findMany({
      where: { productId },
      include: { 
        user: { 
          select: { name: true } // Protects massive payload/exposure of strictly private user data
        } 
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip
    });

    return NextResponse.json(reviews, { headers: corsHeaders });
  } catch (error) {
    return new NextResponse("Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { productId, userId, customerName, rating, comment } = await req.json();

    if (!productId || !rating) {
      return new NextResponse("productId and rating required", { status: 400, headers: corsHeaders });
    }

    const review = await prismadb.review.create({
      data: {
        productId,
        ...(userId && { userId }),
        ...(customerName && { customerName }),
        rating,
        comment
      }
    });

    return NextResponse.json(review, { headers: corsHeaders });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return new NextResponse("You have already reviewed this product", { status: 400, headers: corsHeaders });
    }
    console.error('[REVIEWS_POST]', error);
    return new NextResponse("Internal error", { status: 500, headers: corsHeaders });
  }
}
