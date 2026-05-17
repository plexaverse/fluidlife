import type { Metadata } from "next";
import Link from "next/link";

import { getPublicProducts } from "@/services/server/products";
import { getPublicCategories } from "@/services/server/categories";
import { ProductCard } from "@/components/storefront/product-card";
import { Pagination } from "@/components/ui/pagination";
import type { ProductSummary } from "@/types/storefront";

import { ExploreFilters } from "./components/explore-filters";

export const metadata: Metadata = {
  title: "Explore",
  description: "Browse the full Fluidlife catalogue.",
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

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8 space-y-6">
      <header>
        <h1 className="text-3xl md:text-4xl font-semibold mb-2">Explore</h1>
        <p className="text-sm text-muted-foreground">
          Browse our full catalogue — search by name or filter by category.
        </p>
      </header>

      <ExploreFilters
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        initial={{ q: sp.q, categoryId: sp.categoryId }}
      />

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
        <>
          <p className="text-sm text-muted-foreground">
            {total} {total === 1 ? "product" : "products"}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p as ProductSummary} />
            ))}
          </div>
          <Pagination total={total} page={page} pageSize={PAGE_SIZE} />
        </>
      )}
    </div>
  );
}
