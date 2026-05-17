import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getPublicProducts } from "@/services/server/products";
import { getPublicCategories } from "@/services/server/categories";
import { ProductCard } from "@/components/storefront/product-card";
import { CategoryCard } from "@/components/storefront/category-card";
import type { ProductSummary } from "@/types/storefront";

export const revalidate = 300; // 5 min ISR

export default async function HomePage() {
  const [{ products: featured }, categories] = await Promise.all([
    getPublicProducts({ isFeatured: true, take: 8 }),
    getPublicCategories(),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 brand-gradient opacity-10" aria-hidden />
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-24 md:py-32 text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-4">
            Healthier. Safer. Sustainable.
          </p>
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight mb-6">
            Everyday care, <span className="gradient-text-bold">reimagined</span>.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Fluidlife brings you thoughtfully made hygiene and wellness essentials —
            so the choices that take care of you don&apos;t cost the planet.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/explore">
                Explore products <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/about-us">About Fluidlife</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 md:px-6 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold">Shop by category</h2>
            <Link href="/explore" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.slice(0, 8).map((c) => (
              <CategoryCard key={c.id} id={c.id} name={c.name} image={c.image} productCount={c.productCount} />
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 md:px-6 py-16 bg-muted/30">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold">Featured</h2>
            <Link href="/explore" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              See more →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p as ProductSummary} />
            ))}
          </div>
        </section>
      )}

      {/* If neither categories nor products exist, fall back to the foundation stub */}
      {categories.length === 0 && featured.length === 0 && (
        <section className="mx-auto max-w-6xl px-4 md:px-6 py-16">
          <div className="rounded-2xl border bg-card p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-semibold mb-2">Coming soon</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              We&apos;re finalising our first product line. Check back soon, or read our
              policies below.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
              <Link className="underline-offset-4 hover:underline" href="/privacy-policy">Privacy</Link>
              <span className="text-muted-foreground">·</span>
              <Link className="underline-offset-4 hover:underline" href="/return-policy">Shipping & Returns</Link>
              <span className="text-muted-foreground">·</span>
              <Link className="underline-offset-4 hover:underline" href="/terms-of-service">Terms</Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
