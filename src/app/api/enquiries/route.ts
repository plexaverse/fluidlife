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
    const { name, email, phone, companyName, message } = await req.json();
    if (!name || !email || !phone || !message) {
      return new NextResponse("Missing required fields", { status: 400, headers: corsHeaders });
    }

    const enquiry = await prismadb.distributorEnquiry.create({
      data: {
        name,
        email,
        phone,
        companyName,
        message
      }
    });

    return NextResponse.json(enquiry, { headers: corsHeaders });
  } catch(e) {
    return new NextResponse("Error", { status: 500, headers: corsHeaders });
  }
}

export async function GET(req: Request) {
  try {
    const enquiries = await prismadb.distributorEnquiry.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(enquiries, { headers: corsHeaders });
  } catch(e) {
    return new NextResponse("Error", { status: 500, headers: corsHeaders });
  }
}
