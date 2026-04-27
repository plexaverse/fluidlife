import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { requireAdmin, isResponse } from "@/lib/auth";
import { apiError, apiValidationError } from "@/lib/api-error";
import { logger } from "@/lib/logger";
import { corsHeaders } from "@/lib/cors";
import { safeJson } from "@/lib/safe-json";
import { enforceRateLimit, rateLimits } from "@/lib/ratelimit";
import { enquiryCreateSchema } from "@/lib/schemas";

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function POST(req: Request) {
  const headers = corsHeaders(req);
  try {
    const r = await safeJson(req, { headers });
    if (!r.ok) return r.response;

    const limited = await enforceRateLimit(req, rateLimits.enquirySubmit(), undefined, headers);
    if (limited) return limited;

    const parsed = enquiryCreateSchema.safeParse(r.data);
    if (!parsed.success) return apiValidationError(parsed.error, headers);
    const data = parsed.data;

    const enquiry = await prismadb.distributorEnquiry.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        companyName: data.companyName ?? null,
        message: data.message,
      },
    });
    return NextResponse.json(enquiry, { headers });
  } catch (error) {
    logger.error("[ENQUIRIES_POST]", error);
    return apiError("INTERNAL", "Failed to submit enquiry", headers);
  }
}

export async function GET(req: Request) {
  const headers = corsHeaders(req);
  const auth = await requireAdmin();
  if (isResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const take = Math.min(Math.max(parseInt(searchParams.get("take") || "50", 10) || 50, 1), 100);
    const skip = Math.max(parseInt(searchParams.get("skip") || "0", 10) || 0, 0);

    const enquiries = await prismadb.distributorEnquiry.findMany({
      orderBy: { createdAt: "desc" },
      take,
      skip,
    });
    return NextResponse.json(enquiries, { headers });
  } catch (error) {
    logger.error("[ENQUIRIES_GET]", error);
    return apiError("INTERNAL", "Failed to fetch enquiries", headers);
  }
}
