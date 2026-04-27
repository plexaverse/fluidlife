import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { requireAdminOrSelf, isResponse } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { logger } from "@/lib/logger";
import { corsHeaders } from "@/lib/cors";

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

/**
 * DPDP Act 2023 compliant data-portability endpoint. Returns every piece of
 * personal data we hold about the user as a downloadable JSON dump. Reachable
 * by the user themselves or an admin handling a user's request.
 *
 * NOTE: deletion under DPDP is handled by the existing soft-delete on
 * /api/users/[userId] DELETE. We retain order records (legitimate business
 * purpose: GST records must be kept ~6 years) but redact PII via the
 * `deletedAt` flag and remove the user from notification flows.
 */
export async function GET(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const headers = corsHeaders(req);
  const { userId } = await params;
  if (!userId) return apiError("BAD_REQUEST", "userId required", headers);

  const auth = await requireAdminOrSelf(req, userId);
  if (isResponse(auth)) return auth;

  try {
    const user = await prismadb.user.findUnique({
      where: { id: userId },
      include: {
        addresses: true,
        reviews: {
          include: { product: { select: { id: true, name: true } } },
        },
        wishlistItems: {
          include: { product: { select: { id: true, name: true } } },
        },
        orders: {
          include: {
            orderItems: {
              include: { product: { select: { id: true, name: true } } },
            },
            address: true,
            coupon: { select: { code: true, discountType: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!user) return apiError("NOT_FOUND", "User not found", headers);

    // Match enquiries by email/phone (no FK on DistributorEnquiry).
    const enquiries = await prismadb.distributorEnquiry.findMany({
      where: { OR: [{ email: user.email }, { phone: user.phone }] },
    });

    // Strip internal-only fields.
    const payload = {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
        gstNumber: user.gstNumber,
        isApproved: user.isApproved,
        creditLimit: user.creditLimit,
        creditUsed: user.creditUsed,
        createdAt: user.createdAt,
        deletedAt: user.deletedAt,
      },
      addresses: user.addresses,
      reviews: user.reviews,
      wishlist: user.wishlistItems,
      orders: user.orders,
      enquiries,
    };

    return NextResponse.json(payload, {
      headers: {
        ...headers,
        "Content-Disposition": `attachment; filename="fluidlife-data-${user.id}.json"`,
      },
    });
  } catch (error) {
    logger.error("[USER_EXPORT]", error);
    return apiError("INTERNAL", "Failed to export user data", headers);
  }
}
