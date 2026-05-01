import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { requireAdmin, isResponse } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { logger } from "@/lib/logger";
import { corsHeaders } from "@/lib/cors";
import { createShiprocketOrder, recordShiprocketOrder } from "@/lib/shiprocket";
import { notifyOrderEvent } from "@/lib/notify";

const SHIPPABLE = new Set(["ORDERED"]);

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const headers = corsHeaders(req);
  const auth = await requireAdmin();
  if (isResponse(auth)) return auth;

  const pickupLocation = process.env.SHIPROCKET_PICKUP_LOCATION;
  if (!pickupLocation) {
    return apiError("INTERNAL", "SHIPROCKET_PICKUP_LOCATION is not configured", headers);
  }

  try {
    const { orderId } = await params;
    if (!orderId) return apiError("BAD_REQUEST", "orderId required", headers);

    const order = await prismadb.order.findUnique({
      where: { id: orderId },
      include: {
        address: true,
        user: true,
        orderItems: { include: { product: true } },
      },
    });

    if (!order) return apiError("NOT_FOUND", "Order not found", headers);

    if (!SHIPPABLE.has(order.status)) {
      return apiError(
        "CONFLICT",
        `Order must be in ORDERED state to ship (current: ${order.status})`,
        headers
      );
    }

    if (order.shiprocketOrderId) {
      return apiError("CONFLICT", "Order has already been submitted to Shiprocket", headers);
    }

    const items = order.orderItems.map((item) => ({
      name: item.product.name,
      sku: item.product.id,
      units: item.quantity,
      selling_price: Number(item.priceAtPurchase),
      hsn: item.product.hsnCode ?? undefined,
    }));

    // Aggregate dimensions: use max of each dimension across items.
    const length = Math.max(...order.orderItems.map((i) => i.product.length ?? 10));
    const breadth = Math.max(...order.orderItems.map((i) => i.product.breadth ?? 10));
    const height = Math.max(...order.orderItems.map((i) => i.product.height ?? 10));
    const weight = order.orderItems.reduce(
      (sum, i) => sum + (i.product.weight ?? 0) * i.quantity,
      0
    );

    const result = await createShiprocketOrder({
      orderId: order.orderId,
      orderDate: order.createdAt.toISOString(),
      pickupLocation,
      billingName: order.user.name,
      billingAddress: order.address.address1,
      billingAddress2: order.address.address2 ?? undefined,
      billingCity: order.address.city,
      billingPincode: order.address.pincode ?? "",
      billingState: order.address.state,
      billingCountry: order.address.country,
      billingEmail: order.user.email.endsWith("@placeholder.fluidlife.local")
        ? undefined
        : order.user.email,
      billingPhone: order.user.phone,
      items,
      paymentMethod: order.paymentType === "COD" ? "COD" : "Prepaid",
      subTotal: Number(order.subtotalAmount),
      length: length || 10,
      breadth: breadth || 10,
      height: height || 10,
      weight: weight || 0.5,
    });

    await recordShiprocketOrder({
      orderId: order.orderId,
      shiprocketOrderId: result.shiprocketOrderId,
      raw: result.raw,
    });

    notifyOrderEvent(order.orderId, "ORDER_SHIPPED").catch((e) =>
      logger.error("[notify ORDER_SHIPPED]", e, { orderId: order.id })
    );

    return NextResponse.json(
      {
        shiprocketOrderId: result.shiprocketOrderId,
        shipmentId: result.shipmentId,
        status: result.status,
      },
      { headers }
    );
  } catch (error: any) {
    logger.error("[SHIP_POST]", error);
    return apiError("INTERNAL", error?.message ?? "Failed to create Shiprocket order", headers);
  }
}
