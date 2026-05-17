import type { Metadata } from "next";

import { CheckoutClient } from "./components/checkout-client";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Review your order and complete your purchase.",
};

// Auth-gated; can't be statically prerendered.
export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8 md:py-12">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-semibold">Checkout</h1>
        <p className="text-sm text-muted-foreground mt-1">
          A few quick steps and we&apos;ll get your order on its way.
        </p>
      </header>
      <CheckoutClient />
    </div>
  );
}
