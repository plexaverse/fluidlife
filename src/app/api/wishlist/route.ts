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
    const userId = searchParams.get('userId');

    if (!userId) return new NextResponse("User ID is required", { status: 400, headers: corsHeaders });

    const wishlist = await prismadb.wishlistItem.findMany({
      where: { userId },
      include: { product: { include: { images: true } } }
    });

    return NextResponse.json(wishlist, { headers: corsHeaders });
  } catch (e) {
    return new NextResponse("Error", { status: 500, headers: corsHeaders });
  }
}

export async function POST(req: Request) {
  try {
    const { userId, productId } = await req.json();

    if (!userId || !productId) return new NextResponse("userId and productId required", { status: 400, headers: corsHeaders });

    const item = await prismadb.wishlistItem.create({
      data: {
        userId,
        productId
      }
    });

    return NextResponse.json(item, { headers: corsHeaders });
  } catch (error) {
    if ((error as any).code === 'P2002') {
      return new NextResponse("Already in wishlist", { status: 400, headers: corsHeaders });
    }
    return new NextResponse("Error", { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const productId = searchParams.get('productId');

    if (!userId || !productId) return new NextResponse("userId and productId required", { status: 400, headers: corsHeaders });

    const deleted = await prismadb.wishlistItem.delete({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });

    return NextResponse.json(deleted, { headers: corsHeaders });
  } catch(e) {
    return new NextResponse("Error", { status: 500, headers: corsHeaders });
  }
}
