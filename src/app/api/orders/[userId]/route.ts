import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() { return NextResponse.json({}, { headers: corsHeaders }); }

export async function GET(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(req.url);
    const take = Math.min(parseInt(searchParams.get('take') || '20'), 50);
    const skip = parseInt(searchParams.get('skip') || '0');

    if (!userId) {
      return new NextResponse("User ID required", { status: 400, headers: corsHeaders });
    }

    const orders = await prismadb.order.findMany({
      where: { 
        userId,
        deletedAt: null
      },
      include: {
        orderItems: {
          // Memory boundary constraint: Only fetch needed product subsets
          include: { 
            product: { 
              select: { id: true, name: true, price: true, images: { take: 1 } } 
            } 
          }
        },
        address: true,
        coupon: true
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip
    });

    return NextResponse.json(orders, { headers: corsHeaders });
  } catch (error) {
    return new NextResponse("Error", { status: 500, headers: corsHeaders });
  }
}
