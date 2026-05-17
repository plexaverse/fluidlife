"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useCartStore } from "@/stores/cart-store";
import type { ProductSummary } from "@/types/storefront";

interface AddToCartButtonProps {
  product: ProductSummary;
  /** Compact card variant: single "Add" pill instead of a counter. */
  compact?: boolean;
  className?: string;
}

export function AddToCartButton({ product, compact, className }: AddToCartButtonProps) {
  const addToCart = useCartStore((s) => s.addToCart);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const itemInCart = useCartStore((s) =>
    s.items.find((i) => i.productId === product.id) ?? null
  );

  const outOfStock = product.stock <= 0;

  if (compact || !itemInCart) {
    return (
      <Button
        type="button"
        size={compact ? "sm" : "default"}
        disabled={outOfStock}
        onClick={() => addToCart(product, 1)}
        className={cn("gap-2", className)}
      >
        <ShoppingBag className="h-4 w-4" />
        {outOfStock ? "Out of stock" : "Add to cart"}
      </Button>
    );
  }

  const max = product.stock;
  const qty = itemInCart.quantity;
  const dec = () => updateQuantity(product.id, qty - 1);
  const inc = () => qty < max && updateQuantity(product.id, qty + 1);

  return (
    <div className={cn("inline-flex items-center rounded-full border bg-card", className)}>
      <Button type="button" variant="ghost" size="icon" onClick={dec} aria-label="Decrease quantity">
        <Minus className="h-4 w-4" />
      </Button>
      <span className="min-w-8 text-center text-sm tabular-nums" aria-live="polite">
        {qty}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={inc}
        disabled={qty >= max}
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
