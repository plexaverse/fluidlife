"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Minus, Plus } from "lucide-react";

import { GradientButton } from "@/components/ui/gradient-button";
import { useCartStore } from "@/stores/cart-store";
import { useUIStore } from "@/stores/ui-store";
import type { ProductSummary } from "@/types/storefront";

interface BottomAddToCartBarProps {
  product: ProductSummary;
}

/**
 * Sticky pill at the bottom of the screen with a quantity stepper + Add to
 * Cart CTA. Slides in once the user scrolls — same trigger as takekare.
 */
export function BottomAddToCartBar({ product }: BottomAddToCartBarProps) {
  const [quantity, setQuantity] = useState(1);
  const [isVisible, setIsVisible] = useState(false);
  const addToCart = useCartStore((s) => s.addToCart);
  const openCartDrawer = useUIStore((s) => s.openCartDrawer);

  useEffect(() => {
    const handleScroll = () => setIsVisible(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const outOfStock = product.stock <= 0;

  const onAdd = () => {
    if (outOfStock) return;
    addToCart(product, quantity);
    toast.success(`Added ${quantity} × ${product.name} to cart`);
    openCartDrawer();
  };

  return (
    <div
      className={`fixed bottom-0 left-1/2 -translate-x-1/2 md:bottom-10 md:right-22 bg-white p-2 md:rounded-full w-full md:w-[640px] border shadow-lg z-40 ${
        isVisible ? "block" : "hidden"
      }`}
    >
      <div className="flex items-center gap-3 sm:space-x-4">
        <div className="border rounded-md flex items-center justify-end">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-3 py-1 border-r disabled:opacity-40"
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="px-4 py-1 tabular-nums">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}
            className="px-3 py-1 border-l disabled:opacity-40"
            disabled={quantity >= (product.stock || 99)}
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <GradientButton
          text={outOfStock ? "Out of stock" : "Add to Cart"}
          onClick={onAdd}
          disabled={outOfStock}
          className="flex-1"
        />
      </div>
    </div>
  );
}
