import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { requireAdminOrSelf, isResponse } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { logger } from "@/lib/logger";
import { corsHeaders } from "@/lib/cors";

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const headers = corsHeaders(req);
  const { userId } = await params;
  if (!userId) return apiError("BAD_REQUEST", "User ID required", headers);

  const auth = await requireAdminOrSelf(req, userId);
  if (isResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const take = Math.min(Math.max(parseInt(searchParams.get("take") || "20", 10) || 20, 1), 50);
    const skip = Math.max(parseInt(searchParams.get("skip") || "0", 10) || 0, 0);

    const orders = await prismadb.order.findMany({
      where: { userId, deletedAt: null },
      include: {
        orderItems: {
          include: {
            product: { select: { id: true, name: true, price: true, images: { take: 1 } } },
          },
        },
        address: true,
        coupon: true,
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    });
    return NextResponse.json(orders, { headers });
  } catch (error) {
    logger.error("[ORDERS_GET]", error);
    return apiError("INTERNAL", "Failed to fetch orders", headers);
  }
}
