import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
};

export async function OPTIONS() { return NextResponse.json({}, { headers }); }

export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get('x-api-key') || req.headers.get('X-API-Key');
    if (apiKey !== process.env.SHIPROCKET_WEBHOOK_TOKEN) return NextResponse.json({ error: "Unauthorized" }, { status: 200, headers });

    const body = await req.json();
    const { order_id, status } = body;

    if (!order_id) return NextResponse.json({ message: "Missing order_id" }, { status: 200, headers });

    const order = await prismadb.order.findFirst({
      where: {
        shipRocket: {
          path: ['order_id'],
          equals: order_id
        }
      }
    });

    if (!order) return NextResponse.json({ message: "Order not found" }, { status: 200, headers });

    // Enforce mapping directly to Schema Enums
    let newStatus: 'PAYMENT_PENDING' | 'ORDERED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED' = 'ORDERED';
    
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'confirmed': newStatus = 'ORDERED'; break;
      case 'shipped':
      case 'in_transit': newStatus = 'SHIPPED'; break;
      case 'delivered':
      case 'completed': newStatus = 'DELIVERED'; break;
      case 'cancelled':
      case 'cancelled_by_customer': newStatus = 'CANCELLED'; break;
      case 'returned':
      case 'refunded': newStatus = 'REFUNDED'; break;
      default: return NextResponse.json({ message: "Status unchanged" }, { headers });
    }

    await prismadb.order.update({
      where: { id: order.id },
      data: { status: newStatus }
    });

    return NextResponse.json({ message: "Order status updated" }, { headers });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 200, headers });
  }
}
