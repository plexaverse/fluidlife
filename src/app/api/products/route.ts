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

    const {
      categoryId,
      name,
      description,
      features = [],
      benefits = [],
      usage = [],
      idealFor = [],
      reasonsToBuy = [],
      greenDiscounts = [],
      sustainable = [],
      faq = [], // Expected to be an array of { q, a } (Fix #4)
      certifications = [],
      price,
      b2bPrice, // Distibutor price
      moq = 1,
      originalPrice = 0,
      deliveryPrice = 0,
      isFeatured = false,
      isArchived = false,
      length = 0,
      breadth = 0,
      height = 0,
      weight = 0,
      images = [],
      reviews = [],
    } = body;

    if (!name) return new NextResponse("Product name is required", { status: 400, headers: corsHeaders });
    if (!categoryId) return new NextResponse("Category ID is required", { status: 400, headers: corsHeaders });
    if (price === undefined || price === null) return new NextResponse("Product price is required", { status: 400, headers: corsHeaders });

    const category = await prismadb.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return new NextResponse("Category not found", { status: 404, headers: corsHeaders });
    }

    const product = await prismadb.product.create({
      data: {
        categoryId,
        name,
        description,
        features,
        benefits,
        usage,
        idealFor,
        reasonsToBuy,
        greenDiscounts,
        sustainable,
        faq, // Prisma Json handles nested objects natively
        certifications,
        price: parseFloat(price),
        ...(b2bPrice && { b2bPrice: parseFloat(b2bPrice) }),
        moq,
        originalPrice: parseFloat(originalPrice),
        deliveryPrice: parseFloat(deliveryPrice),
        isFeatured,
        isArchived,
        length,
        breadth,
        height,
        weight,
        images: {
          create: images.map((image: { url: string; id?: string }) => ({
            url: image.url,
          })),
        },
        reviews: {
          create: reviews.map((review: { 
            userId?: string; // Support for Fix #7 anonymous reviews
            customerName?: string; 
            rating: number; 
            comment?: string;
          }) => ({
            ...(review.userId && { userId: review.userId }),
            customerName: review.customerName || null,
            rating: review.rating,
            comment: review.comment || null,
          })),
        },
      },
      include: {
        images: true,
        reviews: true,
        category: {
          include: {
            billboard: true,
          },
        },
      },
    });

    return NextResponse.json(product, { headers: corsHeaders });
  } catch (error) {
    console.error('[PRODUCTS_POST]', error);
    return new NextResponse("Internal error", { status: 500, headers: corsHeaders });
  }
} 

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId') || undefined;
    const isFeatured = searchParams.get('isFeatured') === 'true' ? true : undefined;
    
    const take = Math.min(parseInt(searchParams.get('take') || '50'), 100);
    const skip = parseInt(searchParams.get('skip') || '0');

    // ONLY fetch what is absolutely necessary
    const products = await prismadb.product.findMany({
      where: {
        categoryId,
        isFeatured,
        isArchived: false,
      },
      include: {
        images: true,
        category: true,
        _count: {
          select: { reviews: true } // Subquery count
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
      take,
      skip
    });

    const productIds = products.map((p: any) => p.id);
    
    let ratingMap = new Map();
    if (productIds.length > 0) {
      // Calculate avg directly using PostgreSQL aggregations instead of RAM loops
      const reviewAggregations = await prismadb.review.groupBy({
        by: ['productId'],
        where: { productId: { in: productIds } },
        _avg: { rating: true }
      });
      
      ratingMap = new Map(
        reviewAggregations.map((agg: any) => [agg.productId, agg._avg.rating])
      );
    }

    const output = products.map((product: any) => {
      const avgRating = ratingMap.get(product.id) || 0;
      return {
        ...product,
        averageRating: +Number(avgRating).toFixed(2),
        totalReviews: product._count.reviews
      };
    });

    return NextResponse.json(output, { headers: corsHeaders });
  } catch (error) {
    console.error('[PRODUCTS_GET]', error);
    return new NextResponse("Internal error", { status: 500, headers: corsHeaders });
  }
}
