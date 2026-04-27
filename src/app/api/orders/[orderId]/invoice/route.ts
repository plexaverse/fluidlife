import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { requireAdminOrSelf, isResponse } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { logger } from "@/lib/logger";
import { corsHeaders } from "@/lib/cors";
import { ensureInvoiceNumber, buildInvoicePayload } from "@/lib/invoice";

const INVOICEABLE = new Set(["ORDERED", "SHIPPED", "DELIVERED", "REFUNDED"]);

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const headers = corsHeaders(req);
  try {
    const { orderId } = await params;
    if (!orderId) return apiError("BAD_REQUEST", "orderId required", headers);

    const order = await prismadb.order.findUnique({
      where: { id: orderId },
      select: { userId: true, status: true, isPaid: true, paymentType: true },
    });
    if (!order) return apiError("NOT_FOUND", "Order not found", headers);

    const auth = await requireAdminOrSelf(req, order.userId);
    if (isResponse(auth)) return auth;

    if (!INVOICEABLE.has(order.status)) {
      return apiError("CONFLICT", `Invoice unavailable for order in state ${order.status}`, headers);
    }
    // Prepaid: only invoice once paid. COD/UPI/BANK_TRANSFER: invoice on dispatch (status=ORDERED).
    if (order.paymentType === "PREPAID" && !order.isPaid) {
      return apiError("CONFLICT", "Order is not paid yet", headers);
    }

    await ensureInvoiceNumber(orderId);
    const payload = await buildInvoicePayload(orderId);
    if (!payload) return apiError("NOT_FOUND", "Order not found", headers);

    return NextResponse.json(payload, { headers });
  } catch (error) {
    logger.error("[INVOICE_GET]", error);
    return apiError("INTERNAL", "Failed to build invoice", headers);
  }
}
