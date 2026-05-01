import { format } from "date-fns";
import { notFound } from "next/navigation";
import Link from "next/link";

import prismadb from "@/lib/prismadb";
import { formatter } from "@/lib/utils";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { OrderActions } from "./components/order-actions";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PAYMENT_PENDING: "outline",
  ORDERED: "default",
  SHIPPED: "secondary",
  DELIVERED: "secondary",
  CANCELLED: "destructive",
  REFUNDED: "destructive",
};

interface PageProps {
  params: Promise<{ orderId: string }>;
}

const OrderDetailPage = async ({ params }: PageProps) => {
  const { orderId } = await params;

  const order = await prismadb.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: { include: { product: true } },
      address: true,
      user: true,
      coupon: { select: { code: true, discountType: true, discountValue: true } },
    },
  });

  if (!order) notFound();

  const subtotal = Number(order.subtotalAmount ?? 0);
  const discount = Number(order.discountAmount ?? 0);
  const tax = Number(order.taxAmount ?? 0);
  const delivery = Number(order.deliveryAmount ?? 0);
  const total = Number(order.amount ?? 0);
  const breakup = (order.taxBreakup ?? null) as
    | { interState: boolean; sellerState: string | null; buyerState: string; lines: any[]; totals: any }
    | null;

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex items-center justify-between">
          <Heading
            title={`Order ${order.orderId}`}
            description={`Placed ${format(order.createdAt, "PPpp")}`}
          />
          <Button variant="outline" asChild>
            <Link href="/admin/orders">Back to orders</Link>
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant={STATUS_VARIANT[order.status] ?? "default"}>{order.status}</Badge>
          <Badge variant={order.isPaid ? "default" : "outline"}>
            {order.isPaid ? "Paid" : "Unpaid"}
          </Badge>
          <Badge variant="outline">{order.paymentType}</Badge>
          {order.invoiceNumber && <Badge variant="secondary">Invoice {order.invoiceNumber}</Badge>}
          {order.paymentExpiresAt && order.status === "PAYMENT_PENDING" && (
            <Badge variant="outline">
              Expires {format(order.paymentExpiresAt, "PPpp")}
            </Badge>
          )}
        </div>

        <Separator />

        <OrderActions
          orderDbId={order.id}
          publicOrderId={order.orderId}
          totalAmount={total}
          isPaid={order.isPaid}
          status={order.status}
          paymentType={order.paymentType}
          alreadyRefunded={!!order.refundedAt}
        />

        <Separator />

        <section>
          <h3 className="text-lg font-semibold mb-2">Customer</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <p><span className="text-muted-foreground">Name:</span> {order.user.name}</p>
            <p><span className="text-muted-foreground">Phone:</span> {order.user.phone}</p>
            <p><span className="text-muted-foreground">Email:</span> {order.user.email}</p>
            <p><span className="text-muted-foreground">Role:</span> {order.user.role}</p>
            {order.user.companyName && (
              <p><span className="text-muted-foreground">Company:</span> {order.user.companyName}</p>
            )}
            {order.user.gstNumber && (
              <p><span className="text-muted-foreground">GSTIN:</span> {order.user.gstNumber}</p>
            )}
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2">Shipping address</h3>
          <p className="text-sm">
            {order.address.address1}
            {order.address.address2 ? `, ${order.address.address2}` : ""}
            {order.address.landmark ? `, ${order.address.landmark}` : ""}
            <br />
            {order.address.city}, {order.address.state} — {order.address.pincode}
            <br />
            {order.address.country}
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2">Items</h3>
          <table className="w-full text-sm border">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2">Product</th>
                <th className="text-right p-2">Qty</th>
                <th className="text-right p-2">Unit price</th>
                <th className="text-right p-2">Line total</th>
              </tr>
            </thead>
            <tbody>
              {order.orderItems.map((it) => (
                <tr key={it.id} className="border-t">
                  <td className="p-2">{it.product.name}</td>
                  <td className="p-2 text-right tabular-nums">{it.quantity}</td>
                  <td className="p-2 text-right tabular-nums">
                    {formatter.format(Number(it.priceAtPurchase))}
                  </td>
                  <td className="p-2 text-right tabular-nums">
                    {formatter.format(Number(it.priceAtPurchase) * it.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2">Totals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm max-w-md">
            <p className="text-muted-foreground">Subtotal (GST-inclusive)</p>
            <p className="text-right tabular-nums">{formatter.format(subtotal)}</p>
            {discount > 0 && (
              <>
                <p className="text-muted-foreground">
                  Discount{order.coupon ? ` (${order.coupon.code})` : ""}
                </p>
                <p className="text-right tabular-nums">−{formatter.format(discount)}</p>
              </>
            )}
            {delivery > 0 && (
              <>
                <p className="text-muted-foreground">Delivery</p>
                <p className="text-right tabular-nums">{formatter.format(delivery)}</p>
              </>
            )}
            <p className="text-muted-foreground">GST extracted</p>
            <p className="text-right tabular-nums">{formatter.format(tax)}</p>
            <p className="font-semibold pt-2 border-t">Grand total</p>
            <p className="text-right tabular-nums font-semibold pt-2 border-t">
              {formatter.format(total)}
            </p>
          </div>
        </section>

        {breakup && breakup.lines && breakup.lines.length > 0 && (
          <section>
            <h3 className="text-lg font-semibold mb-2">Tax breakup</h3>
            <p className="text-xs text-muted-foreground mb-2">
              {breakup.interState ? "Inter-state" : "Intra-state"} —{" "}
              {breakup.sellerState ?? "?"} → {breakup.buyerState}
            </p>
            <table className="w-full text-sm border">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-2">Line</th>
                  <th className="text-left p-2">HSN</th>
                  <th className="text-right p-2">Rate</th>
                  <th className="text-right p-2">Taxable</th>
                  <th className="text-right p-2">CGST</th>
                  <th className="text-right p-2">SGST</th>
                  <th className="text-right p-2">IGST</th>
                </tr>
              </thead>
              <tbody>
                {breakup.lines.map((l: any, idx: number) => (
                  <tr key={idx} className="border-t">
                    <td className="p-2">{l.productId === "__delivery__" ? "Delivery" : l.productId.slice(0, 8)}</td>
                    <td className="p-2">{l.hsnCode || "—"}</td>
                    <td className="p-2 text-right tabular-nums">{l.rate}%</td>
                    <td className="p-2 text-right tabular-nums">₹{l.taxable}</td>
                    <td className="p-2 text-right tabular-nums">₹{l.cgst}</td>
                    <td className="p-2 text-right tabular-nums">₹{l.sgst}</td>
                    <td className="p-2 text-right tabular-nums">₹{l.igst}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t font-medium">
                  <td className="p-2" colSpan={3}>Totals</td>
                  <td className="p-2 text-right tabular-nums">₹{breakup.totals?.taxable}</td>
                  <td className="p-2 text-right tabular-nums">₹{breakup.totals?.cgst}</td>
                  <td className="p-2 text-right tabular-nums">₹{breakup.totals?.sgst}</td>
                  <td className="p-2 text-right tabular-nums">₹{breakup.totals?.igst}</td>
                </tr>
              </tfoot>
            </table>
          </section>
        )}

        <section>
          <h3 className="text-lg font-semibold mb-2">Payment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <p><span className="text-muted-foreground">Type:</span> {order.paymentType}</p>
            <p><span className="text-muted-foreground">Paid:</span> {order.isPaid ? "Yes" : "No"}</p>
            {order.paidAt && (
              <p><span className="text-muted-foreground">Paid at:</span> {format(order.paidAt, "PPpp")}</p>
            )}
            {order.razorpayPaymentId && (
              <p>
                <span className="text-muted-foreground">Razorpay payment:</span> {order.razorpayPaymentId}
              </p>
            )}
            {order.refundedAt && (
              <>
                <p><span className="text-muted-foreground">Refunded:</span> {format(order.refundedAt, "PPpp")}</p>
                <p><span className="text-muted-foreground">Refund amount:</span> {formatter.format(Number(order.refundAmount ?? 0))}</p>
                {order.refundId && (
                  <p><span className="text-muted-foreground">Refund id:</span> {order.refundId}</p>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default OrderDetailPage;
