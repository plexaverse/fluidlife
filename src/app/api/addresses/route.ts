import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { requireUser, isResponse } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { logger } from "@/lib/logger";
import { corsHeaders } from "@/lib/cors";
import { safeJson } from "@/lib/safe-json";

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function GET(req: Request) {
  const headers = corsHeaders(req);
  const session = await requireUser(req);
  if (isResponse(session)) return session;

  try {
    const addresses = await prismadb.address.findMany({
      where: { userId: session.userId },
      orderBy: { isDefault: "desc" },
    });
    return NextResponse.json(addresses, { headers });
  } catch (error) {
    logger.error("[ADDRESSES_GET]", error);
    return apiError("INTERNAL", "Failed to fetch addresses", headers);
  }
}

export async function POST(req: Request) {
  const headers = corsHeaders(req);
  const session = await requireUser(req);
  if (isResponse(session)) return session;

  try {
    const r = await safeJson(req, { headers });
    if (!r.ok) return r.response;
    const body = r.data as any;
    const address1 = typeof body?.address1 === "string" ? body.address1.trim() : "";
    const city = typeof body?.city === "string" ? body.city.trim() : "";
    const state = typeof body?.state === "string" ? body.state.trim() : "";
    const country = typeof body?.country === "string" ? body.country.trim() : "";
    const pincode = typeof body?.pincode === "string" ? body.pincode.trim() : "";

    if (!address1) return apiError("BAD_REQUEST", "Address line 1 is required", headers);
    if (!city) return apiError("BAD_REQUEST", "City is required", headers);
    if (!state) return apiError("BAD_REQUEST", "State is required", headers);
    if (!country) return apiError("BAD_REQUEST", "Country is required", headers);
    if (!pincode) return apiError("BAD_REQUEST", "Pincode is required for shipping", headers);

    const address = await prismadb.address.create({
      data: {
        address1,
        address2: typeof body.address2 === "string" ? body.address2 : null,
        city,
        pincode,
        landmark: typeof body.landmark === "string" ? body.landmark : null,
        state,
        country,
        isDefault: Boolean(body.isDefault),
        userId: session.userId,
      },
    });
    return NextResponse.json(address, { headers });
  } catch (error) {
    logger.error("[ADDRESSES_POST]", error);
    return apiError("INTERNAL", "Failed to create address", headers);
  }
}
