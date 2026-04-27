import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { requireAdmin, isResponse } from "@/lib/auth";
import { apiError, apiValidationError } from "@/lib/api-error";
import { logger } from "@/lib/logger";
import { corsHeaders } from "@/lib/cors";
import { safeJson } from "@/lib/safe-json";
import { enquiryStatusSchema } from "@/lib/schemas";

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ enquiryId: string }> }
) {
  const headers = corsHeaders(req);
  const auth = await requireAdmin();
  if (isResponse(auth)) return auth;

  try {
    const { enquiryId } = await params;
    if (!enquiryId) return apiError("BAD_REQUEST", "Enquiry id is required", headers);

    const enquiry = await prismadb.distributorEnquiry.findUnique({ where: { id: enquiryId } });
    if (!enquiry) return apiError("NOT_FOUND", "Enquiry not found", headers);
    return NextResponse.json(enquiry, { headers });
  } catch (error) {
    logger.error("[ENQUIRY_GET]", error);
    return apiError("INTERNAL", "Failed to fetch enquiry", headers);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ enquiryId: string }> }
) {
  const headers = corsHeaders(req);
  const auth = await requireAdmin();
  if (isResponse(auth)) return auth;

  try {
    const { enquiryId } = await params;
    if (!enquiryId) return apiError("BAD_REQUEST", "Enquiry id is required", headers);

    const enquiry = await prismadb.distributorEnquiry.delete({ where: { id: enquiryId } });
    return NextResponse.json(enquiry, { headers });
  } catch (error: any) {
    if (error?.code === "P2025") return apiError("NOT_FOUND", "Enquiry not found", headers);
    logger.error("[ENQUIRY_DELETE]", error);
    return apiError("INTERNAL", "Failed to delete enquiry", headers);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ enquiryId: string }> }
) {
  const headers = corsHeaders(req);
  const auth = await requireAdmin();
  if (isResponse(auth)) return auth;

  try {
    const { enquiryId } = await params;
    if (!enquiryId) return apiError("BAD_REQUEST", "Enquiry id is required", headers);

    const r = await safeJson(req, { headers });
    if (!r.ok) return r.response;
    const parsed = enquiryStatusSchema.safeParse(r.data);
    if (!parsed.success) return apiValidationError(parsed.error, headers);

    const enquiry = await prismadb.distributorEnquiry.update({
      where: { id: enquiryId },
      data: { status: parsed.data.status },
    });
    return NextResponse.json(enquiry, { headers });
  } catch (error: any) {
    if (error?.code === "P2025") return apiError("NOT_FOUND", "Enquiry not found", headers);
    logger.error("[ENQUIRY_PATCH]", error);
    return apiError("INTERNAL", "Failed to update enquiry", headers);
  }
}
