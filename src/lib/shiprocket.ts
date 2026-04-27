import "server-only";
import prismadb from "./prismadb";

/**
 * Persist the Shiprocket order id on our Order so the webhook can find it
 * via an indexed lookup (Order.shiprocketOrderId @unique) instead of a
 * sequential scan over the JSON `shipRocket` blob.
 *
 * Call this from the (still-to-be-built) Shiprocket order-creation flow,
 * e.g. after the Razorpay payment.captured webhook fires for a prepaid order.
 */
export async function recordShiprocketOrder(params: {
  orderId: string; // our public Order.orderId (ORD-XXXX)
  shiprocketOrderId: string;
  raw?: unknown; // optional full Shiprocket response, stored on shipRocket Json
}): Promise<void> {
  await prismadb.order.update({
    where: { orderId: params.orderId },
    data: {
      shiprocketOrderId: params.shiprocketOrderId,
      ...(params.raw !== undefined && { shipRocket: params.raw as any }),
    },
  });
}
