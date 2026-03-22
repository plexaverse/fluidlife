import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";
import crypto from "crypto";
// import { createShiprocketOrderForPrepaid } from "@/lib/createShiprocketOrderForPrepaid";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() { return NextResponse.json({}, { headers }); }

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) return NextResponse.json({ error: "Server error" }, { status: 500, headers });

    const rawBody = await req.text();
    if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 401, headers });

    const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
    if (signature !== expectedSignature) return NextResponse.json({ error: "Invalid signature" }, { status: 401, headers });

    const body = JSON.parse(rawBody);

    if (body.event === "payment.authorized") {
      const orderId = body.payload.payment.entity.notes.orderId;

      await prismadb.order.update({
        where: { id: orderId },
        data: { isPaid: true },
      });

      // The integration file for Shiprocket should be called here
      // await createShiprocketOrderForPrepaid({ orderId });
    }
    
    return NextResponse.json({}, { headers });
  } catch (error) {
    console.error("[RAZORPAY_WEBHOOK]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500, headers });
  }
}
