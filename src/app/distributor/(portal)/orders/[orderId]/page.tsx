import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getDistributorSession } from "@/lib/distributor-auth";
import prismadb from "@/lib/prismadb";
import { formatter } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface PageProps {
  params: Promise<{ orderId: string }>;
}

const STATUS_LABEL: Record<string, string> = {
  PAYMENT_PENDING: "Pending payment",
  ORDERED: "Confirmed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export default async function DistributorOrderDetail({ params }: PageProps) {
  const session = await getDistributorSession();
  if (!session) redirect("/distributor/login");

  const { orderId } = await params;
  const order = await prismadb.order.findUnique({
    where: { id: orderId },
    include: {
      address: true,
      orderItems: {
        include: { product: { select: { id: true, name: true, hsnCode: true } } },
      },
    },
  });

  if (!order || order.userId !== session.userId) notFound();

  const INVOICEABLE = new Set(["ORDERED", "SHIPPED", "DELIVERED", "REFUNDED"]);
  const canDownloadInvoice = INVOICEABLE.has(order.status) && (order.paymentType !== "PREPAID" || order.isPaid);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/distributor/orders" className="text-sm text-gray-500 hover:underline">
            ← Back to orders
          </Link>
          <h1 className="text-2xl font-bold mt-2 font-mono">{order.orderId}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Placed on{" "}
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">{STATUS_LABEL[order.status] ?? order.status}</Badge>
          {canDownloadInvoice && (
            <Button asChild variant="outline" size="sm">
              <a href={`/api/orders/${order.id}/invoice/pdf`} download>
                <Download className="h-4 w-4 mr-2" /> Invoice PDF
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Delivery address */}
      <section className="bg-white dark:bg-neutral-900 rounded-xl border p-6">
        <h2 className="font-semibold text-sm uppercase tracking-wide text-gray-500 mb-3">Delivery address</h2>
        <p>{order.address.address1}</p>
        {order.address.address2 && <p>{order.address.address2}</p>}
        {order.address.landmark && <p>Near {order.address.landmark}</p>}
        <p>
          {order.address.city}, {order.address.state} — {order.address.pincode}
        </p>
        <p>{order.address.country}</p>
      </section>

      {/* Items */}
      <section className="bg-white dark:bg-neutral-900 rounded-xl border overflow-hidden">
        <h2 className="font-semibold text-sm uppercase tracking-wide text-gray-500 px-6 py-4 border-b">
          Items
        </h2>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-neutral-800 border-b">
            <tr>
              {["Product", "HSN", "Qty", "Unit price", "Total"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
            {order.orderItems.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">{item.product.name}</td>
                <td className="px-4 py-3 text-gray-500">{item.product.hsnCode || "—"}</td>
                <td className="px-4 py-3 tabular-nums">{item.quantity}</td>
                <td className="px-4 py-3 tabular-nums">{formatter.format(Number(item.priceAtPurchase))}</td>
                <td className="px-4 py-3 tabular-nums font-medium">
                  {formatter.format(Number(item.priceAtPurchase) * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Totals */}
      <section className="flex justify-end">
        <div className="w-72 bg-white dark:bg-neutral-900 rounded-xl border p-6 space-y-2 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span>
            <span>{formatter.format(Number(order.subtotalAmount))}</span>
          </div>
          {Number(order.discountAmount) > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>Discount</span>
              <span>−{formatter.format(Number(order.discountAmount))}</span>
            </div>
          )}
          {Number(order.deliveryAmount) > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>Delivery</span>
              <span>{formatter.format(Number(order.deliveryAmount))}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-500">
            <span>GST</span>
            <span>{formatter.format(Number(order.taxAmount))}</span>
          </div>
          <div className="flex justify-between font-bold text-base border-t pt-2">
            <span>Total</span>
            <span>{formatter.format(Number(order.amount))}</span>
          </div>
          <p className="text-xs text-gray-400 pt-1">
            {order.paymentType} · {order.isPaid ? "Paid" : "Unpaid"}
          </p>
        </div>
      </section>
    </div>
  );
}
