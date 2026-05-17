import type { Metadata } from "next";
import Link from "next/link";
import { XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Payment failed",
  description: "We couldn't complete your payment. You can retry from your account.",
};

interface PageProps {
  searchParams: Promise<{ orderId?: string }>;
}

export default async function OrderFailurePage({ searchParams }: PageProps) {
  const { orderId } = await searchParams;
  return (
    <div className="mx-auto max-w-xl px-4 md:px-6 py-16 text-center">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-6">
        <XCircle className="h-8 w-8 text-destructive" />
      </div>
      <h1 className="text-3xl md:text-4xl font-semibold mb-3">Payment didn&apos;t go through</h1>
      <p className="text-muted-foreground mb-6">
        We held your order
        {orderId ? (
          <>
            {" "}
            <span className="font-mono">{orderId}</span>
          </>
        ) : null}{" "}
        for the next few minutes — you can retry the payment, or your inventory will be released
        automatically.
      </p>
      <p className="text-sm text-muted-foreground mb-8">
        Nothing has been charged. If you see a hold on your card, it will be released by your bank.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/account?tab=orders">Retry payment</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/contact">Contact support</Link>
        </Button>
      </div>
    </div>
  );
}
