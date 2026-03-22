import { NextResponse } from 'next/server';
import prismadb from '@/lib/prismadb';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400, headers: corsHeaders });
    }

    const user = await prismadb.user.findFirst({
      where: {
        id: userId,
        deletedAt: null // Fix #10: Ignore soft-deleted users
      },
      include: {
        addresses: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json(user, { headers: corsHeaders });
  } catch (error) {
    console.error("GET USER ERROR", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500, headers: corsHeaders });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;
    const body = await req.json();

    const { name, email, companyName, gstNumber } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400, headers: corsHeaders });
    }

    const user = await prismadb.user.update({
      where: {
        id: userId,
      },
      data: {
        name,
        email,
        companyName,
        gstNumber
      }
    });

    return NextResponse.json(user, { headers: corsHeaders });
  } catch (error) {
    console.error("UPDATE USER ERROR", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400, headers: corsHeaders });
    }

    // Fix #10 - Soft delete instead of hard delete
    const user = await prismadb.user.update({
      where: {
        id: userId,
      },
      data: {
        deletedAt: new Date()
      }
    });

    return NextResponse.json(user, { headers: corsHeaders });
  } catch (error) {
    console.error("DELETE USER ERROR", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500, headers: corsHeaders });
  }
}
