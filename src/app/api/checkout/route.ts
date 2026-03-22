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
    const { orderId, isPaid, paymentType, addressId, userId, amount, discountAmount, couponId, items } = body;

    if (!orderId || !addressId || !userId || !items || !items.length) {
      return new NextResponse("Missing highly required fields", { status: 400, headers: corsHeaders });
    }

    const order = await prismadb.order.create({
      data: {
        orderId,
        isPaid: isPaid || false,
        paymentType: paymentType || 'PREPAID',
        status: 'ORDERED',
        amount: parseFloat(amount),
        discountAmount: parseFloat(discountAmount || 0),
        addressId,
        userId,
        ...(couponId && { couponId }),
        orderItems: {
          create: items.map((item: any) => ({
            product: { connect: { id: item.productId } },
            quantity: item.quantity,
            priceAtPurchase: parseFloat(item.priceAtPurchase), 
          })),
        }
      },
      include: {
        orderItems: true
      }
    });

    return NextResponse.json(order, { headers: corsHeaders });
  } catch(error) {
    console.error('[CHECKOUT_POST]', error);
    return new NextResponse("Error", { status: 500, headers: corsHeaders });
  }
}
