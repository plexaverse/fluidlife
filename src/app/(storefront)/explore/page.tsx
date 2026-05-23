import type { Metadata } from "next";
import Link from "next/link";

import { getPublicProducts } from "@/services/server/products";
import { getPublicCategories } from "@/services/server/categories";
import { ProductCard } from "@/components/storefront/product-card";
import { Pagination } from "@/components/ui/pagination";
import type { ProductSummary } from "@/types/storefront";

import { CategoryTabs } from "./components/category-tabs";
import { ExploreFeaturesSection } from "./components/explore-features-section";
import { ExploreFilters } from "./components/explore-filters";
import { ExploreHero } from "./components/explore-hero";

export const metadata: Metadata = {
  title: "Explore",
  description:
    "Browse the full Fluidlife catalogue — search by name or filter by category.",
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

interface PageProps {
  searchParams: Promise<{ page?: string; q?: string; categoryId?: string }>;
}

export default async function ExplorePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [{ products, total }, categories] = await Promise.all([
    getPublicProducts({
      q: sp.q,
      categoryId: sp.categoryId,
      take: PAGE_SIZE,
      skip,
    }),
    getPublicCategories(),
  ]);

  const activeCategory = categories.find((c) => c.id === sp.categoryId);

  return (
    <main className="min-h-screen">
      <ExploreHero />

      {/* Bento — "Explore Our Products" + draggable product cards */}
      <ExploreFeaturesSection />

      <div className="mx-auto max-w-7xl px-4 md:px-6 pb-16 space-y-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="gradient-text-semibold text-3xl lg:text-4xl tracking-tight">
            {activeCategory ? activeCategory.name : "All products"}
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mt-3">
            {activeCategory
              ? `Everything we make in ${activeCategory.name.toLowerCase()}.`
              : "Browse the full Fluidlife catalogue — search by name or filter by category."}
          </p>
        </div>

        {/* Category pill tabs */}
        <CategoryTabs
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          activeId={sp.categoryId}
        />

        {/* Search input */}
        <div className="flex justify-center">
          <ExploreFilters initial={{ q: sp.q }} />
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl border bg-card p-12 text-center">
            <p className="text-muted-foreground mb-2">
              {sp.q || sp.categoryId
                ? "No products match your filters."
                : "No products available yet."}
            </p>
            {(sp.q || sp.categoryId) && (
              <Link className="text-sm underline" href="/explore">
                Clear filters
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground text-center">
              {total} {total === 1 ? "product" : "products"}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p as ProductSummary} />
              ))}
            </div>
            <Pagination total={total} page={page} pageSize={PAGE_SIZE} />
          </div>
        )}
      </div>
    </main>
  );
}
