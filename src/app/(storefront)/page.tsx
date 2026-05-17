import Link from "next/link";

import { getPublicCategories } from "@/services/server/categories";
import { getPublicProducts } from "@/services/server/products";
import prismadb from "@/lib/prismadb";
import { CategoryCard } from "@/components/storefront/category-card";
import { LandingBanner } from "@/components/storefront/landing-banner";
import { OurStrengths } from "@/components/storefront/our-strengths";
import { InnovationProduct } from "@/components/storefront/innovation-product";
import { ProductCarousel } from "@/components/storefront/product-carousel";
import { AboutNextProject } from "@/components/storefront/about-next-project";
import { ReviewsMarquee } from "@/components/storefront/reviews-marquee";
import type { ProductSummary } from "@/types/storefront";

// Page reads from Postgres at request time — see (storefront)/layout.tsx for
// the same reason the parent layout also opts out of build-time prerender.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Pull the data the home page needs in parallel. Reviews live on the
  // Review model directly; the home marquee picks the most recent eight.
  const [{ products: featured }, categories, recentReviewRows] = await Promise.all([
    getPublicProducts({ isFeatured: true, take: 12 }),
    getPublicCategories(),
    prismadb.review
      .findMany({
        where: { comment: { not: null } },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 8,
      })
      .catch(() => [] as any[]),
  ]);

  const heroProduct = (featured[0] as ProductSummary | undefined) ?? null;
  const carouselProducts = featured.slice(1);
  const recentReviews = recentReviewRows.map((r: any) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    authorName: r.user?.name ?? r.customerName ?? "Anonymous",
  }));

  return (
    <>
      <LandingBanner />

      {/* Featured carousel */}
      {carouselProducts.length > 0 && (
        <ProductCarousel
          products={carouselProducts}
          title="Loved by our customers"
          subtitle="A few of our most-purchased Fluidlife essentials."
        />
      )}

      {/* Hero product highlight (uses the first featured item) */}
      <InnovationProduct product={heroProduct} />

      {/* Differentiators */}
      <OurStrengths />

      {/* Categories grid */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 md:px-6 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="gradient-text-semibold text-3xl">Shop by category</h2>
            <Link
              href="/explore"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.slice(0, 8).map((c) => (
              <CategoryCard
                key={c.id}
                id={c.id}
                name={c.name}
                image={c.image}
                productCount={c.productCount}
              />
            ))}
          </div>
        </section>
      )}

      {/* Customer reviews marquee */}
      {recentReviews.length > 0 && <ReviewsMarquee reviews={recentReviews} speed="slow" />}

      {/* Pre-footer CTA */}
      <AboutNextProject />

      {/* Foundation fallback when there's nothing yet */}
      {categories.length === 0 && featured.length === 0 && (
        <section className="mx-auto max-w-6xl px-4 md:px-6 py-16">
          <div className="rounded-2xl border bg-card p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-semibold mb-2">Coming soon</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              We&apos;re finalising our first product line. Check back soon, or read our policies below.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
              <Link className="underline-offset-4 hover:underline" href="/privacy-policy">
                Privacy
              </Link>
              <span className="text-muted-foreground">·</span>
              <Link className="underline-offset-4 hover:underline" href="/return-policy">
                Shipping &amp; Returns
              </Link>
              <span className="text-muted-foreground">·</span>
              <Link className="underline-offset-4 hover:underline" href="/terms-of-service">
                Terms
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
