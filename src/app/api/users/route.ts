import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { requireAdmin, isResponse } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { logger } from "@/lib/logger";
import { corsHeaders } from "@/lib/cors";

const ROLE_VALUES = new Set(["CUSTOMER", "DISTRIBUTOR", "ADMIN"]);

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

/**
 * Admin list of users. Supports pagination + filters by role and approval
 * status, plus a simple `q` substring match on phone/name/email.
 */
export async function GET(req: Request) {
  const headers = corsHeaders(req);
  const auth = await requireAdmin();
  if (isResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const take = Math.min(Math.max(parseInt(searchParams.get("take") || "50", 10) || 50, 1), 100);
    const skip = Math.max(parseInt(searchParams.get("skip") || "0", 10) || 0, 0);
    const role = searchParams.get("role") || undefined;
    const approvedParam = searchParams.get("isApproved");
    const q = (searchParams.get("q") || "").trim().slice(0, 100);

    const where: any = { deletedAt: null };
    if (role && ROLE_VALUES.has(role)) where.role = role;
    if (approvedParam === "true") where.isApproved = true;
    if (approvedParam === "false") where.isApproved = false;
    if (q) {
      where.OR = [
        { phone: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { companyName: { contains: q, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prismadb.user.findMany({
        where,
        select: {
          id: true,
          phone: true,
          name: true,
          email: true,
          role: true,
          companyName: true,
          gstNumber: true,
          isApproved: true,
          creditLimit: true,
          creditUsed: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      prismadb.user.count({ where }),
    ]);

    return NextResponse.json({ users, total }, { headers });
  } catch (error) {
    logger.error("[USERS_GET]", error);
    return apiError("INTERNAL", "Failed to fetch users", headers);
  }
}
