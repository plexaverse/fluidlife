"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatter } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { useUIStore } from "@/stores/ui-store";

export function CartDrawer() {
  const router = useRouter();
  const open = useUIStore((s) => s.cartDrawerOpen);
  const close = useUIStore((s) => s.closeCartDrawer);

  const items = useCartStore((s) => s.items);
  const totalAmount = useCartStore((s) => s.totalAmount);
  const totalItems = useCartStore((s) => s.totalItems);
  const updateQuantity = useCartStore((s) => s.updateQuantity);

  const handleCheckout = () => {
    close();
    router.push("/checkout");
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && close()}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Your cart ({totalItems})
          </SheetTitle>
          <SheetDescription className="sr-only">
            Review the items in your cart and proceed to checkout.
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-lg font-medium">Your cart is empty</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Add a few things to get started.
            </p>
            <Button asChild className="mt-6" onClick={close}>
              <Link href="/explore">Browse products</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <ul className="divide-y">
                {items.map((it) => {
                  const img = it.product.images[0]?.url;
                  const unitPrice = parseFloat(it.product.price);
                  return (
                    <li key={it.id} className="flex gap-3 py-4">
                      <Link
                        href={`/product/${it.productId}`}
                        onClick={close}
                        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted"
                      >
                        {img ? (
                          <Image src={img} alt="" fill sizes="80px" className="object-cover" />
                        ) : (
                          <div className="absolute inset-0 brand-gradient opacity-20" />
                        )}
                      </Link>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div className="flex justify-between gap-2">
                          <Link
                            href={`/product/${it.productId}`}
                            onClick={close}
                            className="text-sm font-medium line-clamp-2 hover:underline"
                          >
                            {it.product.name}
                          </Link>
                          <button
                            type="button"
                            onClick={() => updateQuantity(it.productId, 0)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            aria-label="Remove from cart"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="inline-flex items-center rounded-full border">
                            <button
                              type="button"
                              onClick={() => updateQuantity(it.productId, it.quantity - 1)}
                              className="px-2 py-1 hover:bg-muted/50 rounded-l-full"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="px-3 text-sm tabular-nums">{it.quantity}</span>
                            <button
                              type="button"
                              onClick={() =>
                                it.quantity < it.product.stock &&
                                updateQuantity(it.productId, it.quantity + 1)
                              }
                              disabled={it.quantity >= it.product.stock}
                              className="px-2 py-1 hover:bg-muted/50 rounded-r-full disabled:opacity-40"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className="text-sm font-medium tabular-nums">
                            {formatter.format(it.totalPrice)}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {formatter.format(unitPrice)} each
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="border-t px-6 py-4 space-y-3 bg-card">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal (incl. GST)</span>
                <span className="font-semibold tabular-nums">
                  {formatter.format(totalAmount)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Shipping calculated at checkout.
              </p>
              <Button onClick={handleCheckout} className="w-full" size="lg">
                Proceed to checkout
              </Button>
              <Button variant="ghost" className="w-full" onClick={close}>
                Continue shopping
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
