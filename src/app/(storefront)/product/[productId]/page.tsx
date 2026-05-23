import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getPublicProduct } from "@/services/server/products";
import { getPublicReviews } from "@/services/server/reviews";
import type { ProductSummary } from "@/types/storefront";

import { ProductDetailClient } from "./components/product-detail-client";

export const dynamic = "force-dynamic";

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

// Each Json-stored FAQ entry may be {q,a} or a "Q: … A: …" string —
// ProductFaq handles both, just pass through.
function normalizeFaq(raw: unknown): ({ q: string; a: string } | string)[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (x): x is { q: string; a: string } | string =>
      typeof x === "string" ||
      (!!x &&
        typeof x === "object" &&
        typeof (x as { q?: unknown }).q === "string" &&
        typeof (x as { a?: unknown }).a === "string"),
  );
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { productId } = await params;
  const product = await getPublicProduct(productId);
  if (!product) notFound();

  const { reviews, total: reviewsTotal } = await getPublicReviews({
    productId,
    take: 20,
  });

  // The product service guarantees these arrays exist, but the storefront
  // ProductSummary type doesn't carry the long-form fields — narrow the type
  // we pass to the client component.
  const faq = normalizeFaq((product as unknown as { faq: unknown }).faq);

  const clientProduct = product as unknown as ProductSummary & {
    description: string | null;
    features: string[];
    benefits: string[];
    usage: string[];
    idealFor: string[];
    reasonsToBuy: string[];
    greenDiscounts: string[];
    sustainable: string[];
    category: { id: string; name: string };
    averageRating: number | null;
    totalReviews: number;
  };

  return (
    <ProductDetailClient
      product={clientProduct}
      faq={faq}
      reviews={reviews}
      reviewsTotal={reviewsTotal}
    />
  );
}
