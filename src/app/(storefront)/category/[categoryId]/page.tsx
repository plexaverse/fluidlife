import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

import { getPublicCategory } from "@/services/server/categories";
import { getPublicProducts } from "@/services/server/products";
import { ProductCard } from "@/components/storefront/product-card";
import { Pagination } from "@/components/ui/pagination";
import type { ProductSummary } from "@/types/storefront";

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
    <>
      {/* Category banner */}
      <section className="relative h-48 md:h-64 overflow-hidden bg-muted">
        {bannerImage && (
          <Image
            src={bannerImage}
            alt={category.name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center text-center px-4">
          <div className="text-white">
            <p className="text-xs uppercase tracking-widest text-white/80 mb-2">Category</p>
            <h1 className="text-3xl md:text-5xl font-semibold">{category.name}</h1>
          </div>
        </div>
      </section>

      {/* Breadcrumb */}
      <nav className="mx-auto max-w-7xl px-4 md:px-6 pt-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/explore" className="hover:text-foreground">Categories</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{category.name}</span>
      </nav>

      {/* Products */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 py-8">
        {products.length === 0 ? (
          <div className="rounded-2xl border bg-card p-12 text-center">
            <p className="text-muted-foreground">No products in this category yet.</p>
            <Link href="/explore" className="text-sm underline mt-4 inline-block">
              Browse all products
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-6">
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
      </section>
    </>
  );
}
