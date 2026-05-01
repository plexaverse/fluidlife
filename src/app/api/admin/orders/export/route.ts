import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { requireAdmin, isResponse } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { logger } from "@/lib/logger";

const VALID_STATUSES = new Set([
  "PAYMENT_PENDING", "ORDERED", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED",
]);

function escapeCell(val: unknown): string {
  const str = val == null ? "" : String(val);
  // Wrap in quotes if it contains comma, newline, or double-quote; escape internal quotes.
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsvRow(cells: unknown[]): string {
  return cells.map(escapeCell).join(",");
}

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (isResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const from = searchParams.get("from"); // ISO date string
    const to = searchParams.get("to");     // ISO date string

    if (statusParam && !VALID_STATUSES.has(statusParam)) {
      return apiError("BAD_REQUEST", `Invalid status: ${statusParam}`);
    }

    const where: any = {};
    if (statusParam) where.status = statusParam;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const orders = await prismadb.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        orderId: true,
        status: true,
        paymentType: true,
        isPaid: true,
        subtotalAmount: true,
        discountAmount: true,
        deliveryAmount: true,
        taxAmount: true,
        amount: true,
        createdAt: true,
        paidAt: true,
        refundedAt: true,
        refundAmount: true,
        shiprocketOrderId: true,
        razorpayPaymentId: true,
        user: { select: { name: true, email: true, phone: true } },
        address: { select: { city: true, state: true, pincode: true } },
        coupon: { select: { code: true } },
      },
    });

    const header = [
      "Order ID", "Status", "Payment Type", "Paid",
      "Subtotal", "Discount", "Delivery", "GST", "Total",
      "Customer Name", "Email", "Phone",
      "City", "State", "Pincode",
      "Coupon", "Razorpay Payment ID", "Shiprocket Order ID",
      "Created At", "Paid At", "Refunded At", "Refund Amount",
    ];

    const rows = orders.map((o) =>
      toCsvRow([
        o.orderId,
        o.status,
        o.paymentType,
        o.isPaid ? "Yes" : "No",
        o.subtotalAmount.toFixed(2),
        o.discountAmount.toFixed(2),
        o.deliveryAmount.toFixed(2),
        o.taxAmount.toFixed(2),
        o.amount.toFixed(2),
        o.user.name,
        o.user.email,
        o.user.phone,
        o.address.city,
        o.address.state,
        o.address.pincode ?? "",
        o.coupon?.code ?? "",
        o.razorpayPaymentId ?? "",
        o.shiprocketOrderId ?? "",
        o.createdAt.toISOString(),
        o.paidAt?.toISOString() ?? "",
        o.refundedAt?.toISOString() ?? "",
        o.refundAmount?.toFixed(2) ?? "",
      ])
    );

    const csv = [toCsvRow(header), ...rows].join("\r\n");
    const date = new Date().toISOString().slice(0, 10);
    const filename = `orders-${date}${statusParam ? `-${statusParam.toLowerCase()}` : ""}.csv`;

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    logger.error("[ORDERS_EXPORT]", error);
    return apiError("INTERNAL", "Failed to export orders");
  }
}
