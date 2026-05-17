"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { ChevronDown, Loader2, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn, formatter } from "@/lib/utils";
import { apiError } from "@/services/api-client";
import { cancelOrder, listOrders, type OrderListItem } from "@/services/orders";
import { loadRazorpaySdk, openRazorpayCheckout } from "@/services/checkout";
import { useAuthStore } from "@/stores/auth-store";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PAYMENT_PENDING: "outline",
  ORDERED: "default",
  SHIPPED: "secondary",
  DELIVERED: "secondary",
  CANCELLED: "destructive",
  REFUNDED: "destructive",
};

const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";

export function OrdersTab({ userId }: { userId: string }) {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [retrying, setRetrying] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);

  const refresh = async () => {
    setLoading(true);
    try {
      const list = await listOrders(userId, { take: 50 });
      setOrders(list);
    } catch (e) {
      toast.error(apiError(e, "Could not load orders").message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const toggle = (id: string) =>
    setExpanded((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const retryPayment = async (order: OrderListItem) => {
    if (!RAZORPAY_KEY_ID) {
      toast.error("Payment gateway not configured");
      return;
    }
    setRetrying(order.id);
    try {
      const ok = await loadRazorpaySdk();
      if (!ok) {
        toast.error("Failed to load payment gateway");
        return;
      }
      openRazorpayCheckout({
        keyId: RAZORPAY_KEY_ID,
        amountInPaise: Math.round(parseFloat(order.amount) * 100),
        orderId: order.orderId,
        razorpayOrderId: order.razorpayOrderId,
        prefill: { name: user?.name, email: user?.email, contact: user?.phone },
        onSuccess: () => {
          toast.success("Payment received — your order is confirmed.");
          refresh();
        },
        onDismiss: () => setRetrying(null),
        onFailure: () => {
          toast.error("Payment failed. You can try again.");
          setRetrying(null);
        },
      });
    } catch (e) {
      toast.error(apiError(e, "Could not start payment").message);
    } finally {
      setRetrying(null);
    }
  };

  const handleCancel = async (order: OrderListItem) => {
    if (!confirm("Cancel this order? This can't be undone.")) return;
    try {
      await cancelOrder(order.id);
      toast.success("Order cancelled. Stock has been restored.");
      refresh();
    } catch (e) {
      toast.error(apiError(e, "Could not cancel order").message);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
        <Loader2 className="inline h-4 w-4 animate-spin mr-2" /> Loading your orders…
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-12 text-center">
        <p className="text-lg font-medium mb-2">No orders yet</p>
        <p className="text-sm text-muted-foreground mb-6">
          Once you place your first order, it&apos;ll appear here.
        </p>
        <Button asChild>
          <Link href="/explore">Browse products</Link>
        </Button>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {orders.map((order) => {
        const isOpen = expanded.has(order.id);
        const canRetry =
          order.status === "PAYMENT_PENDING" &&
          order.paymentType === "PREPAID" &&
          !order.isPaid;
        const canCancel = ["PAYMENT_PENDING", "ORDERED"].includes(order.status);

        return (
          <li key={order.id} className="rounded-2xl border bg-card overflow-hidden">
            <button
              type="button"
              onClick={() => toggle(order.id)}
              className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-muted/30 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-mono text-sm">{order.orderId}</span>
                  <Badge variant={STATUS_VARIANT[order.status] ?? "default"}>{order.status}</Badge>
                  <Badge variant="outline" className="text-xs">
                    {order.paymentType}
                  </Badge>
                  {order.invoiceNumber && (
                    <Badge variant="secondary" className="text-xs">
                      Invoice {order.invoiceNumber}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Placed {format(new Date(order.createdAt), "PPP")} ·{" "}
                  {order.orderItems.length} {order.orderItems.length === 1 ? "item" : "items"}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-semibold tabular-nums">
                  {formatter.format(parseFloat(order.amount))}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    isOpen && "rotate-180"
                  )}
                />
              </div>
            </button>

            {isOpen && (
              <div className="border-t bg-muted/20 px-5 py-5 space-y-5">
                {/* Line items */}
                <ul className="space-y-3">
                  {order.orderItems.map((it) => {
                    const img = it.product.images[0]?.url;
                    return (
                      <li key={it.id} className="flex gap-3">
                        <Link
                          href={`/product/${it.product.id}`}
                          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted"
                        >
                          {img && (
                            <Image src={img} alt="" fill sizes="64px" className="object-cover" />
                          )}
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/product/${it.product.id}`}
                            className="text-sm font-medium hover:underline line-clamp-2"
                          >
                            {it.product.name}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {it.quantity} × {formatter.format(parseFloat(it.priceAtPurchase))}
                          </p>
                        </div>
                        <p className="text-sm tabular-nums shrink-0">
                          {formatter.format(parseFloat(it.priceAtPurchase) * it.quantity)}
                        </p>
                      </li>
                    );
                  })}
                </ul>

                <Separator />

                {/* Totals */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="tabular-nums">
                        {formatter.format(parseFloat(order.subtotalAmount))}
                      </span>
                    </div>
                    {parseFloat(order.discountAmount) > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount {order.coupon ? `(${order.coupon.code})` : ""}</span>
                        <span className="tabular-nums">
                          −{formatter.format(parseFloat(order.discountAmount))}
                        </span>
                      </div>
                    )}
                    {parseFloat(order.deliveryAmount) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Delivery</span>
                        <span className="tabular-nums">
                          {formatter.format(parseFloat(order.deliveryAmount))}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">GST extracted</span>
                      <span className="tabular-nums">
                        {formatter.format(parseFloat(order.taxAmount))}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 font-semibold border-t mt-2">
                      <span>Total</span>
                      <span className="tabular-nums">
                        {formatter.format(parseFloat(order.amount))}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                      Shipping
                    </p>
                    <p>{order.address.address1}</p>
                    {order.address.address2 && <p>{order.address.address2}</p>}
                    <p>
                      {order.address.city}, {order.address.state}
                      {order.address.pincode ? ` — ${order.address.pincode}` : ""}
                    </p>
                    <p className="text-muted-foreground">{order.address.country}</p>
                    {order.paidAt && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Paid {format(new Date(order.paidAt), "PPp")}
                      </p>
                    )}
                    {order.refundedAt && (
                      <p className="mt-1 text-xs text-destructive">
                        Refunded {format(new Date(order.refundedAt), "PPp")} ·{" "}
                        {formatter.format(parseFloat(order.refundAmount ?? "0"))}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {canRetry && (
                    <Button
                      onClick={() => retryPayment(order)}
                      disabled={retrying === order.id}
                      size="sm"
                    >
                      {retrying === order.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <RotateCcw className="h-4 w-4 mr-1.5" />
                          Retry payment
                        </>
                      )}
                    </Button>
                  )}
                  {canCancel && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancel(order)}
                    >
                      Cancel order
                    </Button>
                  )}
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
