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
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const billboardId = typeof body?.billboardId === "string" ? body.billboardId : "";
    if (!name) return apiError("BAD_REQUEST", "Name is required", headers);
    if (!billboardId) return apiError("BAD_REQUEST", "Billboard ID is required", headers);

    try {
      const category = await prismadb.category.create({ data: { name, billboardId } });
      return NextResponse.json(category, { headers });
    } catch (e: any) {
      if (e?.code === "P2003") return apiError("BAD_REQUEST", "Billboard does not exist", headers);
      throw e;
    }
  } catch (error) {
    logger.error("[CATEGORIES_POST]", error);
    return apiError("INTERNAL", "Failed to create category", headers);
  }
}

export async function GET(req: Request) {
  const headers = corsHeaders(req);
  try {
    const { searchParams } = new URL(req.url);
    const take = Math.min(Math.max(parseInt(searchParams.get("take") || "50", 10) || 50, 1), 100);
    const skip = Math.max(parseInt(searchParams.get("skip") || "0", 10) || 0, 0);

    const categories = await prismadb.category.findMany({
      include: { billboard: true },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    });

    const list = categories.map((c) => ({ ...c, image: c.billboard?.imageUrl ?? null }));
    return NextResponse.json(list, { headers });
  } catch (error) {
    logger.error("[CATEGORIES_GET]", error);
    return apiError("INTERNAL", "Failed to fetch categories", headers);
  }
}
