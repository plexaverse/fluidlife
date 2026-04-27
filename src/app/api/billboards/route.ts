import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { requireAdmin, isResponse } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { logger } from "@/lib/logger";
import { corsHeaders } from "@/lib/cors";
import { safeJson } from "@/lib/safe-json";

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function POST(req: Request) {
  const headers = corsHeaders(req);
  const auth = await requireAdmin();
  if (isResponse(auth)) return auth;

  try {
    const r = await safeJson(req, { headers });
    if (!r.ok) return r.response;
    const body = r.data as any;
    const label = typeof body?.label === "string" ? body.label.trim() : "";
    const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl.trim() : "";

    if (!label) return apiError("BAD_REQUEST", "Label is required", headers);
    if (!imageUrl) return apiError("BAD_REQUEST", "Image URL is required", headers);

    const billboard = await prismadb.billboard.create({ data: { label, imageUrl } });
    return NextResponse.json(billboard, { headers });
  } catch (error) {
    logger.error("[BILLBOARDS_POST]", error);
    return apiError("INTERNAL", "Failed to create billboard", headers);
  }
}

export async function GET(req: Request) {
  const headers = corsHeaders(req);
  try {
    const { searchParams } = new URL(req.url);
    const take = Math.min(Math.max(parseInt(searchParams.get("take") || "50", 10) || 50, 1), 100);
    const skip = Math.max(parseInt(searchParams.get("skip") || "0", 10) || 0, 0);

    const billboards = await prismadb.billboard.findMany({
      orderBy: { createdAt: "desc" },
      take,
      skip,
    });
    return NextResponse.json(billboards, { headers });
  } catch (error) {
    logger.error("[BILLBOARDS_GET]", error);
    return apiError("INTERNAL", "Failed to fetch billboards", headers);
  }
}
