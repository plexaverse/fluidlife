import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Order placed",
  description: "Your order has been placed successfully.",
};

interface PageProps {
  searchParams: Promise<{ orderId?: string }>;
}

export default async function OrderSuccessPage({ searchParams }: PageProps) {
  const { orderId } = await searchParams;
  return (
    <div className="mx-auto max-w-xl px-4 md:px-6 py-16 text-center">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 mb-6">
        <CheckCircle2 className="h-8 w-8 text-emerald-600" />
      </div>
      <h1 className="text-3xl md:text-4xl font-semibold mb-3">Order placed!</h1>
      <p className="text-muted-foreground mb-6">
        Thank you for your order. We&apos;ve emailed a confirmation
        {orderId ? (
          <>
            {" "}
            and your order number is <span className="font-mono">{orderId}</span>.
          </>
        ) : (
          "."
        )}
      </p>
      <p className="text-sm text-muted-foreground mb-8">
        You can track this order from your account dashboard once it ships.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/account?tab=orders">View orders</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/explore">Keep shopping</Link>
        </Button>
      </div>
    </div>
  );
}
