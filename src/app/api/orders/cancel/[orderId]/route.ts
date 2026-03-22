import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() { return NextResponse.json({}, { headers: corsHeaders }); }

export async function PUT(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;
    
    const order = await prismadb.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED'
      }
    });

    return NextResponse.json(order, { headers: corsHeaders });
  } catch (error) {
    return new NextResponse("Error", { status: 500, headers: corsHeaders });
  }
}
