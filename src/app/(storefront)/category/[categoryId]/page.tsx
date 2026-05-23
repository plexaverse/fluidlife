import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";

import { getPublicCategory } from "@/services/server/categories";
import { getPublicProducts } from "@/services/server/products";
import { ProductCard } from "@/components/storefront/product-card";
import { Pagination } from "@/components/ui/pagination";
import type { ProductSummary } from "@/types/storefront";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

interface PageProps {
  params: Promise<{ categoryId: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categoryId } = await params;
  const category = await getPublicCategory(categoryId);
  if (!category) return { title: "Category not found" };
  return {
    title: category.name,
    description: `Shop ${category.name} on Fluidlife.`,
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { categoryId } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const category = await getPublicCategory(categoryId);
  if (!category) notFound();

  const { products, total } = await getPublicProducts({
    categoryId,
    take: PAGE_SIZE,
    skip,
  });

  const bannerImage = category.billboard?.imageUrl;

  return (
    <main className="min-h-screen">
      {/* Billboard hero — ported 1:1 from takekare's category page: full
          80vh, dark overlay, uppercase gradient title pinned to the bottom,
          double-chevron scroll cue that bounces. */}
      {bannerImage && (
        <div className="relative w-full h-[80vh]">
          <Image
            src={bannerImage}
            alt={category.billboard?.label ?? category.name}
            fill
            priority
            sizes="100vw"
            className="object-cover pt-30 md:pt-24"
          />
          <div className="absolute inset-0 flex items-end justify-center px-4 bg-black/60 mt-30 md:mt-24">
            <div className="flex flex-col items-center">
              <h1 className="gradient-text-bold text-white text-3xl sm:text-4xl md:text-6xl text-center mb-10 md:mb-20 drop-shadow-lg uppercase">
                {category.name.toUpperCase()}
              </h1>

              <div className="text-center mt-5 animate-bounce">
                <svg
                  width="40"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="19 12 12 19 5 12" />
                </svg>
                <svg
                  width="40"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ transform: "translateY(-10px)" }}
                >
                  <polyline points="19 12 12 19 5 12" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products grid */}
      <div className="container mx-auto px-4 py-6 sm:py-8 md:py-12">
        {products.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-gray-500">No products found in this category.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              {total} {total === 1 ? "product" : "products"}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p as ProductSummary} />
              ))}
            </div>
            <Pagination total={total} page={page} pageSize={PAGE_SIZE} />
          </>
        )}
      </div>
    </main>
  );
}
