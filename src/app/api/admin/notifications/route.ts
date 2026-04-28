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
    const status = searchParams.get("status") || undefined; // sent | failed
    const refType = searchParams.get("refType") || undefined; // order | enquiry
    const refId = searchParams.get("refId") || undefined;

    const where: any = {};
    if (status === "sent" || status === "failed") where.status = status;
    if (refType) where.refType = refType;
    if (refId) where.refId = refId;

    const [logs, total] = await Promise.all([
      prismadb.notificationLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      prismadb.notificationLog.count({ where }),
    ]);
    return NextResponse.json({ logs, total });
  } catch (error) {
    logger.error("[NOTIFICATIONS_GET]", error);
    return apiError("INTERNAL", "Failed to fetch notifications");
  }
}
