import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";

import { formatter } from "@/lib/utils";
import type { ProductSummary } from "@/types/storefront";

import { AddToCartButton } from "./add-to-cart-button";

interface ProductCardProps {
  product: ProductSummary;
  /** Compact card variant for dense grids. */
  compact?: boolean;
}

export function ProductCard({ product, compact }: ProductCardProps) {
  const price = parseFloat(product.price);
  const original = parseFloat(product.originalPrice);
  const hasDiscount = original > 0 && original > price;
  const discountPct = hasDiscount ? Math.round(((original - price) / original) * 100) : 0;
  const primaryImage = product.images[0]?.url;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/product/${product.id}`} className="relative block aspect-square overflow-hidden bg-muted">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 brand-gradient opacity-10" />
        )}
        {hasDiscount && (
          <span className="absolute left-3 top-3 rounded-full bg-destructive px-2 py-0.5 text-xs font-medium text-destructive-foreground">
            -{discountPct}%
          </span>
        )}
        {product.stock <= 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
            Out of stock
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link href={`/product/${product.id}`} className="line-clamp-2 text-sm font-medium hover:underline">
          {product.name}
        </Link>

        {(product.averageRating ?? 0) > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="tabular-nums">
              {product.averageRating?.toFixed(1)}{" "}
              <span className="text-muted-foreground">({product.totalReviews ?? 0})</span>
            </span>
          </div>
        )}

        <div className="flex items-baseline gap-2">
          <span className="text-base font-semibold tabular-nums">
            {formatter.format(price)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through tabular-nums">
              {formatter.format(original)}
            </span>
          )}
        </div>

        <div className="mt-auto pt-2">
          <AddToCartButton product={product} compact={compact} className="w-full" />
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="aspect-square bg-muted animate-pulse" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
        <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
      </div>
    </div>
  );
}
