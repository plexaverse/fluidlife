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
    const { name, billboardId } = body;

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }
    if (!billboardId) {
      return new NextResponse("Billboard ID is required", { status: 400 });
    }

    const category = await prismadb.category.create({
      data: {
        name,
        billboardId,
      },
    });

    return NextResponse.json(category, { headers: corsHeaders });
  } catch (error) {
    console.error('[CATEGORIES_POST]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const take = Math.min(parseInt(searchParams.get('take') || '50'), 100);
    const skip = parseInt(searchParams.get('skip') || '0');

    // O(1) SQL Joins instead of JS Map finds
    const categories = await prismadb.category.findMany({
      include: {
        billboard: true
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip
    });

    const list = categories.map((category: any) => {
      return {
        ...category,
        image: category.billboard?.imageUrl || null,
      };
    });

    return NextResponse.json(list, { headers: corsHeaders });
  } catch (error) {
    console.error('[CATEGORIES_GET]', error);
    return new NextResponse("Internal error", { status: 500, headers: corsHeaders });
  }
}
