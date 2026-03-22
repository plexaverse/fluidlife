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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { label, imageUrl } = body;

    if (!label) {
      return new NextResponse("Label is required", { status: 400 });
    }
    if (!imageUrl) {
      return new NextResponse("Image URL is required", { status: 400 });
    }

    const billboard = await prismadb.billboard.create({
      data: {
        label,
        imageUrl,
      },
    });

    return NextResponse.json(billboard, { headers: corsHeaders });
  } catch (error) {
    console.error('[BILLBOARDS_POST]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const billboards = await prismadb.billboard.findMany();
    return NextResponse.json(billboards, { headers: corsHeaders });
  } catch (error) {
    console.error('[BILLBOARDS_GET]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
