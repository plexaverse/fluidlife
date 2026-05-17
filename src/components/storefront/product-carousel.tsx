"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { ProductCard } from "@/components/storefront/product-card";
import type { ProductSummary } from "@/types/storefront";

interface ProductCarouselProps {
  products: ProductSummary[];
  title?: string;
  subtitle?: string;
}

/**
 * Horizontally-scrolling featured products carousel. Uses native CSS
 * `scroll-snap` + arrow buttons that step one card at a time. No swiper
 * dep — keeps the bundle lean.
 */
export function ProductCarousel({
  products,
  title = "Featured products",
  subtitle,
}: ProductCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  if (products.length === 0) return null;

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + 24 : 320;
    el.scrollBy({ left: step * dir, behavior: "smooth" });
  };

  return (
    <section className="py-12 px-4 md:px-10">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="gradient-text-semibold text-3xl">{title}</h2>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              className="rounded-full border bg-card p-2 hover:bg-muted transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              className="rounded-full border bg-card p-2 hover:bg-muted transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </header>
        <div
          ref={scrollerRef}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {products.map((p) => (
            <div key={p.id} className="snap-start shrink-0 w-[70vw] sm:w-[40vw] md:w-72 lg:w-80">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
