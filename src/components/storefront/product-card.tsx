"use client";

import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { Star, StarHalf } from "lucide-react";

import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { useUIStore } from "@/stores/ui-store";
import type { ProductSummary } from "@/types/storefront";

import { WishlistButton } from "./wishlist-button";

interface ProductCardProps {
  product: ProductSummary;
  /** Compact card variant for dense grids (carousel). Slimmer button. */
  compact?: boolean;
}

/**
 * Takekare-style product card. Whole image+meta area is one Link to the
 * product detail page; the WishlistButton and ADD TO CART button stop
 * propagation so they don't navigate.
 *
 * Visuals match takekare's ProductCard verbatim:
 *  - cream (`bg-yellow-50`) image bed, image rendered as `object-contain`
 *    so the whole product packaging shows
 *  - red `%OFF` badge top-left when discounted
 *  - 5-star Rating row (yellow filled)
 *  - blue→purple→pink gradient price with strikethrough original
 *  - solid black full-width `ADD TO CART` flush at the bottom
 */
export function ProductCard({ product, compact }: ProductCardProps) {
  const price = parseFloat(product.price);
  const original = parseFloat(product.originalPrice);
  const hasDiscount = original > 0 && original > price;
  const discountPct = hasDiscount ? Math.round(((original - price) / original) * 100) : 0;
  const primaryImage = product.images[0]?.url;
  const outOfStock = product.stock <= 0;

  const addToCart = useCartStore((s) => s.addToCart);
  const openCartDrawer = useUIStore((s) => s.openCartDrawer);

  const onAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    addToCart(product, 1);
    toast.success(`Added ${product.name} to cart`);
    openCartDrawer();
  };

  return (
    <article className="group relative rounded-lg shadow-md overflow-hidden bg-white">
      <Link href={`/product/${product.id}`} className="block">
        {/* Image bed */}
        <div className="relative bg-yellow-50 aspect-square flex items-center justify-center overflow-hidden">
          {primaryImage ? (
            <Image
              src={primaryImage}
              alt={product.name}
              width={300}
              height={300}
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
              className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 brand-gradient opacity-10" />
          )}

          {/* Discount badge */}
          {hasDiscount && (
            <div className="absolute top-2 left-2 bg-red-500 text-white rounded-lg px-2 py-1 text-xs font-bold">
              {discountPct}% OFF
            </div>
          )}

          {outOfStock && (
            <span className="absolute left-2 bottom-2 rounded-full bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
              Out of stock
            </span>
          )}
        </div>

        {/* Title + rating + price */}
        <div className="p-4">
          <h2 className="text-sm md:text-lg mb-1 min-h-15 flex items-center line-clamp-2">
            {product.name}
          </h2>

          {/* Mobile: rating above price row; desktop: rating beside */}
          <Rating rating={product.averageRating ?? 0} className="md:hidden mb-2" />
          <div className="flex items-center justify-between gap-2">
            <Rating rating={product.averageRating ?? 0} className="hidden md:flex" />
            <div className="flex items-baseline">
              <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text text-xl font-bold">
                ₹{price.toLocaleString("en-IN")}
              </span>
              {hasDiscount && (
                <span className="ml-2 text-gray-500 line-through text-sm self-end">
                  ₹{original.toLocaleString("en-IN")}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      <WishlistButton productId={product.id} className="absolute right-3 top-3" />

      {/* ADD TO CART — sits outside the Link so the click doesn't navigate */}
      <button
        type="button"
        onClick={onAdd}
        disabled={outOfStock}
        className={cn(
          "w-full bg-black text-white text-sm font-medium tracking-wide hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
          compact ? "py-1.5" : "py-2",
        )}
      >
        {outOfStock ? "OUT OF STOCK" : "ADD TO CART"}
      </button>
    </article>
  );
}

/** Skeleton placeholder matching the card's footprint. */
export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg shadow-md bg-white">
      <div className="aspect-square bg-yellow-50 animate-pulse" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
        <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
      </div>
      <div className="h-9 bg-gray-900 animate-pulse" />
    </div>
  );
}

// ── Small inline rating row ──────────────────────────────────────────
// Local to keep the card self-contained. Matches takekare's Rating
// component visually (yellow filled stars + half star), sized to the
// card's footprint.

interface RatingProps {
  rating: number;
  className?: string;
}

function Rating({ rating, className }: RatingProps) {
  return (
    <div className={cn("flex items-center", className)}>
      {Array.from({ length: 5 }).map((_, index) => {
        const isFull = index < Math.floor(rating);
        const isHalf = index === Math.floor(rating) && rating % 1 !== 0;
        if (isHalf) {
          return (
            <StarHalf
              key={index}
              className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500"
            />
          );
        }
        return (
          <Star
            key={index}
            className={cn(
              "h-3.5 w-3.5",
              isFull ? "text-yellow-500 fill-yellow-500" : "text-gray-300",
            )}
          />
        );
      })}
    </div>
  );
}
