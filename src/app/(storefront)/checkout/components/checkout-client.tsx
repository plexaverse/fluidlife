"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatter } from "@/lib/utils";
import { apiError } from "@/services/api-client";
import { createCheckout, loadRazorpaySdk, openRazorpayCheckout, type PaymentType } from "@/services/checkout";
import { useAuthStore } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";
import { useCheckoutStore } from "@/stores/checkout-store";
import { useUIStore } from "@/stores/ui-store";
import type { Address } from "@/types/storefront";

import { AddressSelector } from "./address-selector";
import { CouponInput } from "./coupon-input";

const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";

export function CheckoutClient() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const openLoginModal = useUIStore((s) => s.openLoginModal);

  const items = useCartStore((s) => s.items);
  const totalAmount = useCartStore((s) => s.totalAmount);
  const clearCart = useCartStore((s) => s.clear);

  const discountAmount = useCheckoutStore((s) => s.discountAmount);
  const couponCode = useCheckoutStore((s) => s.couponCode);
  const resetCheckout = useCheckoutStore((s) => s.reset);

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentType>("PREPAID");
  const [placing, setPlacing] = useState(false);

  // Stable idempotency key for the lifetime of this checkout page render.
  // If the user navigates away and back, they get a fresh key — which is fine
  // because the cart contents will create a new order anyway.
  const idempotencyKey = useMemo(() => {
    if (typeof window === "undefined") return "";
    return crypto.randomUUID();
  }, []);

  // Prompt sign-in if not authenticated.
  useEffect(() => {
    if (!isAuthenticated) openLoginModal();
  }, [isAuthenticated, openLoginModal]);

  const subtotal = totalAmount;
  const finalAmount = Math.max(0, subtotal - discountAmount);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-12 text-center">
        <p className="text-lg font-medium mb-2">Your cart is empty</p>
        <p className="text-sm text-muted-foreground mb-6">
          Add a few items before checking out.
        </p>
        <Button asChild>
          <Link href="/explore">Browse products</Link>
        </Button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border bg-card p-12 text-center">
        <p className="text-lg font-medium mb-2">Sign in to continue</p>
        <p className="text-sm text-muted-foreground mb-6">
          We need to associate your order with an account.
        </p>
        <Button onClick={openLoginModal}>Sign in / Sign up</Button>
      </div>
    );
  }

  const placeOrder = async () => {
    if (!selectedAddress) {
      toast.error("Please select a shipping address");
      return;
    }
    setPlacing(true);

    try {
      const order = await createCheckout({
        addressId: selectedAddress.id,
        paymentType: paymentMethod,
        items: items.map((it) => ({ productId: it.productId, quantity: it.quantity })),
        ...(couponCode && { couponCode }),
        idempotencyKey,
      });

      // COD / BANK_TRANSFER / UPI-on-delivery: order is already ORDERED, just redirect.
      if (paymentMethod !== "PREPAID") {
        clearCart();
        resetCheckout();
        router.push(`/order-success?orderId=${encodeURIComponent(order.orderId)}`);
        return;
      }

      // PREPAID: open Razorpay overlay.
      if (!RAZORPAY_KEY_ID) {
        toast.error("Payment gateway not configured");
        setPlacing(false);
        return;
      }
      const ok = await loadRazorpaySdk();
      if (!ok) {
        toast.error("Failed to load payment gateway");
        setPlacing(false);
        return;
      }

      const amountPaise = Math.round(parseFloat(order.amount) * 100);
      openRazorpayCheckout({
        keyId: RAZORPAY_KEY_ID,
        amountInPaise: amountPaise,
        orderId: order.orderId,
        razorpayOrderId: order.razorpayOrderId,
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone,
        },
        onSuccess: () => {
          // Server reconciles via the Razorpay webhook; we just route to success.
          clearCart();
          resetCheckout();
          router.push(`/order-success?orderId=${encodeURIComponent(order.orderId)}`);
        },
        onDismiss: () => {
          setPlacing(false);
          toast("Payment cancelled. Your order is held for 15 minutes — you can retry.", {
            icon: "ℹ️",
          });
        },
        onFailure: () => {
          setPlacing(false);
          router.push(`/order-failure?orderId=${encodeURIComponent(order.orderId)}`);
        },
      });
    } catch (e) {
      toast.error(apiError(e, "Could not place order").message);
      setPlacing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">1. Shipping address</h2>
          <AddressSelector
            selectedId={selectedAddress?.id ?? null}
            onSelect={setSelectedAddress}
          />
        </section>

        <Separator />

        <section>
          <h2 className="text-xl font-semibold mb-4">2. Payment method</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(
              [
                { id: "PREPAID", title: "Pay now", desc: "Cards, UPI, netbanking via Razorpay" },
                { id: "COD", title: "Cash on delivery", desc: "Pay when your order arrives" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPaymentMethod(opt.id)}
                className={`text-left rounded-xl border bg-card p-4 transition-colors ${
                  paymentMethod === opt.id
                    ? "border-primary ring-2 ring-primary/20"
                    : "hover:border-muted-foreground/40"
                }`}
              >
                <p className="font-medium">{opt.title}</p>
                <p className="text-sm text-muted-foreground">{opt.desc}</p>
              </button>
            ))}
          </div>
        </section>

        <Separator />

        <section>
          <h2 className="text-xl font-semibold mb-4">3. Have a coupon?</h2>
          <CouponInput orderTotal={subtotal} />
        </section>
      </div>

      {/* Order summary sidebar */}
      <aside className="lg:sticky lg:top-24 h-fit rounded-2xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Order summary</h2>

        <ul className="space-y-3 max-h-64 overflow-y-auto -mx-2 px-2">
          {items.map((it) => {
            const img = it.product.images[0]?.url;
            return (
              <li key={it.id} className="flex gap-3 text-sm">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                  {img && <Image src={img} alt="" fill sizes="56px" className="object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="line-clamp-2">{it.product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {it.quantity} × {formatter.format(parseFloat(it.product.price))}
                  </p>
                </div>
                <p className="font-medium tabular-nums">
                  {formatter.format(it.totalPrice)}
                </p>
              </li>
            );
          })}
        </ul>

        <Separator />

        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal (incl. GST)</span>
            <span className="tabular-nums">{formatter.format(subtotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount {couponCode ? `(${couponCode})` : ""}</span>
              <span className="tabular-nums">−{formatter.format(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span className="text-muted-foreground">Calculated by server</span>
          </div>
        </div>

        <Separator />

        <div className="flex items-baseline justify-between">
          <span className="font-semibold">Total</span>
          <span className="text-xl font-semibold tabular-nums">
            {formatter.format(finalAmount)}
          </span>
        </div>

        <Button
          onClick={placeOrder}
          disabled={placing || !selectedAddress}
          className="w-full"
          size="lg"
        >
          {placing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : paymentMethod === "PREPAID" ? (
            `Pay ${formatter.format(finalAmount)}`
          ) : (
            "Place order"
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Final tax & delivery applied on the server. By placing the order you agree to our{" "}
          <Link href="/terms-of-service" className="underline">
            terms
          </Link>
          .
        </p>
      </aside>
    </div>
  );
}
