"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { Heart, Loader2, ShoppingBag, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatter } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";

export function WishlistTab() {
  const { entries, loaded, loading, load, toggle } = useWishlistStore();
  const addToCart = useCartStore((s) => s.addToCart);

  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  if (loading && !loaded) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
        <Loader2 className="inline h-4 w-4 animate-spin mr-2" /> Loading your wishlist…
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-12 text-center">
        <Heart className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
        <p className="text-lg font-medium mb-2">Your wishlist is empty</p>
        <p className="text-sm text-muted-foreground mb-6">
          Tap the heart on any product to save it for later.
        </p>
        <Button asChild>
          <Link href="/explore">Browse products</Link>
        </Button>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {entries.map((e) => {
        const product = e.product;
        const img = product.images[0]?.url;
        const price = parseFloat(product.price);
        return (
          <li key={e.id} className="rounded-2xl border bg-card p-4 flex gap-4">
            <Link
              href={`/product/${product.id}`}
              className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted"
            >
              {img && <Image src={img} alt="" fill sizes="96px" className="object-cover" />}
            </Link>
            <div className="flex-1 min-w-0 flex flex-col">
              <Link
                href={`/product/${product.id}`}
                className="text-sm font-medium hover:underline line-clamp-2"
              >
                {product.name}
              </Link>
              <p className="text-sm font-semibold tabular-nums mt-1">
                {formatter.format(price)}
              </p>
              {product.stock <= 0 && (
                <p className="text-xs text-destructive mt-1">Out of stock</p>
              )}
              <div className="mt-auto flex items-center gap-2 pt-2">
                <Button
                  size="sm"
                  disabled={product.stock <= 0}
                  onClick={() => addToCart(product, 1)}
                >
                  <ShoppingBag className="h-4 w-4 mr-1.5" />
                  Add to cart
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={async () => {
                    const r = await toggle(product.id);
                    if (r === "removed") toast.success("Removed from wishlist");
                    if (r === "error") toast.error("Could not update wishlist");
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Remove
                </Button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
