import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { requireAdmin, isResponse } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { logger } from "@/lib/logger";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (isResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const take = Math.min(Math.max(parseInt(searchParams.get("take") || "100", 10) || 100, 1), 200);
    const skip = Math.max(parseInt(searchParams.get("skip") || "0", 10) || 0, 0);
    const source = searchParams.get("source") || undefined;

    const where: any = {};
    if (source) where.source = source;

    const [events, total] = await Promise.all([
      prismadb.webhookEvent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      prismadb.webhookEvent.count({ where }),
    ]);

    return NextResponse.json({ events, total });
  } catch (error) {
    logger.error("[WEBHOOK_EVENTS_GET]", error);
    return apiError("INTERNAL", "Failed to fetch webhook events");
  }
}
