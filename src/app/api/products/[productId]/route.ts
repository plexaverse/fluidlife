import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;

    if (!productId) {
      return new NextResponse("Product id is required", { status: 400 });
    }

    const product = await prismadb.product.findUnique({
      where: {
        id: productId,
      },
      include: {
        images: true,
        category: true,
        reviews: true,
      },
    });

    if (!product) {
      return new NextResponse("Product not found", { status: 404 });
    }

    return NextResponse.json(product, { headers: corsHeaders });
  } catch (error) {
    console.error('[PRODUCT_GET]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const body = await req.json();

    const {
      name,
      description,
      price,
      originalPrice,
      categoryId,
      isFeatured,
      isArchived,
      features,
      reasonsToBuy,
      idealFor,
      images,
    } = body;

    if (!productId) {
      return new NextResponse("Product id is required", { status: 400 });
    }

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    if (!images || !images.length) {
      return new NextResponse("Images are required", { status: 400 });
    }

    if (!price) {
      return new NextResponse("Price is required", { status: 400 });
    }

    if (!categoryId) {
      return new NextResponse("Category id is required", { status: 400 });
    }

    await prismadb.product.update({
      where: {
        id: productId,
      },
      data: {
        name,
        description,
        price,
        originalPrice,
        categoryId,
        isFeatured,
        isArchived,
        features,
        reasonsToBuy,
        idealFor,
        images: {
          deleteMany: {},
        },
      },
    });

    const product = await prismadb.product.update({
      where: {
        id: productId,
      },
      data: {
        images: {
          createMany: {
            data: [
              ...images.map((image: { url: string }) => image),
            ],
          },
        },
      },
      include: {
        images: true,
        category: true,
      }
    });

    return NextResponse.json(product, { headers: corsHeaders });
  } catch (error) {
    console.error('[PRODUCT_PATCH]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;

    if (!productId) {
      return new NextResponse("Product id is required", { status: 400 });
    }

    const product = await prismadb.product.delete({
      where: {
        id: productId,
      },
    });

    return NextResponse.json(product, { headers: corsHeaders });
  } catch (error) {
    console.error('[PRODUCT_DELETE]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
