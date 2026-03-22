import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return new NextResponse("User ID is required", { status: 400 });
    }

    const addresses = await prismadb.address.findMany({
      where: { userId }
    });

    return NextResponse.json(addresses, { headers: corsHeaders });
  } catch (error) {
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { address1, address2, city, pincode, landmark, state, country, isDefault, userId } = body;

    if (!userId) return new NextResponse("User ID is required", { status: 400, headers: corsHeaders });
    if (!address1) return new NextResponse("Address line 1 is required", { status: 400, headers: corsHeaders });
    if (!city) return new NextResponse("City is required for Shiprocket", { status: 400, headers: corsHeaders }); // Fix #9
    if (!state) return new NextResponse("State is required", { status: 400, headers: corsHeaders });
    if (!country) return new NextResponse("Country is required", { status: 400, headers: corsHeaders });

    const address = await prismadb.address.create({
      data: {
        address1,
        address2,
        city,
        pincode,
        landmark,
        state,
        country,
        isDefault: isDefault || false,
        userId
      }
    });

    return NextResponse.json(address, { headers: corsHeaders });
  } catch (error) {
    console.error('[ADDRESSES_POST]', error);
    return new NextResponse("Internal error", { status: 500, headers: corsHeaders });
  }
}
