import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Check, Leaf, Shield, Star, Truck } from "lucide-react";

import { getPublicProduct } from "@/services/server/products";
import { getPublicReviews } from "@/services/server/reviews";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { formatter } from "@/lib/utils";
import type { ProductSummary } from "@/types/storefront";

import { ProductGallery } from "./components/product-gallery";
import { ProductFaq } from "./components/product-faq";
import { ProductReviews } from "./components/product-reviews";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ productId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { productId } = await params;
  const product = await getPublicProduct(productId);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description ?? `Buy ${product.name} on Fluidlife.`,
    openGraph: {
      title: product.name,
      images: product.images[0]?.url ? [{ url: product.images[0].url }] : undefined,
    },
  };
}

// Each Json-stored FAQ entry comes back as {q, a}; defensively normalise.
function normalizeFaq(raw: unknown): { q: string; a: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is { q: string; a: string } =>
      !!x && typeof x === "object" && typeof (x as any).q === "string" && typeof (x as any).a === "string"
    )
    .filter((x) => x.q.trim().length > 0);
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { productId } = await params;
  const product = await getPublicProduct(productId);
  if (!product) notFound();

  const { reviews, total: reviewsTotal } = await getPublicReviews({
    productId,
    take: 20,
  });

  const price = parseFloat(product.price as unknown as string);
  const original = parseFloat(product.originalPrice as unknown as string);
  const hasDiscount = original > 0 && original > price;
  const discountPct = hasDiscount ? Math.round(((original - price) / original) * 100) : 0;
  const faq = normalizeFaq((product as any).faq);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span className="mx-2">/</span>
        <Link href={`/category/${product.categoryId}`} className="hover:text-foreground">
          {product.category.name}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground line-clamp-1">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <ProductGallery images={product.images} name={product.name} />

        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              {product.category.name}
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold mb-3">{product.name}</h1>

            {(product.averageRating ?? 0) > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="tabular-nums font-medium">{product.averageRating?.toFixed(1)}</span>
                </div>
                <span className="text-muted-foreground">
                  ({product.totalReviews} {product.totalReviews === 1 ? "review" : "reviews"})
                </span>
              </div>
            )}
          </div>

          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl font-semibold tabular-nums">{formatter.format(price)}</span>
            {hasDiscount && (
              <>
                <span className="text-base text-muted-foreground line-through tabular-nums">
                  {formatter.format(original)}
                </span>
                <span className="rounded-full bg-destructive/10 text-destructive px-2 py-0.5 text-xs font-medium">
                  Save {discountPct}%
                </span>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Price inclusive of GST.</p>

          {product.description && (
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          )}

          {/* Reasons to buy */}
          {product.reasonsToBuy?.length > 0 && (
            <ul className="space-y-2">
              {product.reasonsToBuy.map((reason, idx) => (
                <li key={idx} className="flex gap-2 text-sm">
                  <Check className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Add to cart */}
          <div className="pt-4 border-t">
            <AddToCartButton product={product as ProductSummary} className="w-full sm:w-auto" />
            {product.stock > 0 && product.stock <= 10 && (
              <p className="mt-3 text-xs text-amber-700 dark:text-amber-400">
                Only {product.stock} left in stock — order soon.
              </p>
            )}
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-2 pt-4">
            {[
              { Icon: Truck, label: "Pan-India shipping" },
              { Icon: Shield, label: "Secure checkout" },
              { Icon: Leaf, label: "Eco-conscious" },
            ].map(({ Icon, label }) => (
              <div key={label} className="flex flex-col items-center text-center gap-1 rounded-xl border bg-card p-3">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features & ideal-for */}
      {(product.features?.length > 0 || product.idealFor?.length > 0 || product.benefits?.length > 0) && (
        <section className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {product.features?.length > 0 && (
            <FeatureList title="Features" items={product.features} />
          )}
          {product.idealFor?.length > 0 && (
            <FeatureList title="Ideal for" items={product.idealFor} />
          )}
          {product.benefits?.length > 0 && (
            <FeatureList title="Benefits" items={product.benefits} />
          )}
        </section>
      )}

      {/* FAQ */}
      {faq.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-semibold mb-6">FAQ</h2>
          <ProductFaq items={faq} />
        </section>
      )}

      {/* Reviews */}
      <section className="mt-16">
        <ProductReviews
          reviews={reviews}
          total={reviewsTotal}
          averageRating={product.averageRating ?? 0}
        />
      </section>
    </div>
  );
}

function FeatureList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border bg-card p-6">
      <h3 className="font-semibold mb-3">{title}</h3>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {items.map((it, idx) => (
          <li key={idx} className="flex gap-2">
            <Check className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
