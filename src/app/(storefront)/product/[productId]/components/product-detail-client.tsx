"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Minus, Plus, Star, Zap } from "lucide-react";

import { GradientButton } from "@/components/ui/gradient-button";
import { useCartStore } from "@/stores/cart-store";
import { useUIStore } from "@/stores/ui-store";
import type { ProductSummary } from "@/types/storefront";

import { BottomAddToCartBar } from "./bottom-add-to-cart-bar";
import { ProductFaq } from "./product-faq";
import { ProductFeatures } from "./product-features";
import { ProductGallery } from "./product-gallery";
import { ProductReviews } from "./product-reviews";

interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  authorName: string;
  createdAt: Date;
}

interface ProductDetailClientProps {
  product: ProductSummary & {
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
  faq: ({ q: string; a: string } | string)[];
  reviews: ReviewItem[];
  reviewsTotal: number;
}

/**
 * Interactive product detail page. Mirrors takekare's layout exactly:
 *
 *  - Two-column hero (gallery left, info right)
 *  - Quantity stepper + "Add to Cart" + orange/yellow "Buy Now" (lightning)
 *  - Accordion expanding into Product Details / Benefits
 *  - <ProductFeatures /> scroll timeline (Reasons / Usage / Ideal / Green / Sustainability)
 *  - <ProductReviews /> infinite marquee
 *  - FAQ accordion (takekare style) next to a "Have any other queries?" CTA
 *  - <BottomAddToCartBar /> sticky pill that appears on scroll
 *
 * Buy Now uses the cart store's `enterDirectBuy` so the user's existing cart
 * isn't clobbered.
 */
export function ProductDetailClient({
  product,
  faq,
  reviews,
  reviewsTotal,
}: ProductDetailClientProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const addToCart = useCartStore((s) => s.addToCart);
  const enterDirectBuy = useCartStore((s) => s.enterDirectBuy);
  const openCartDrawer = useUIStore((s) => s.openCartDrawer);

  const price = parseFloat(product.price as unknown as string);
  const original = parseFloat(product.originalPrice as unknown as string);
  const hasDiscount = original > 0 && original > price;
  const outOfStock = product.stock <= 0;

  const handleAddToCart = () => {
    if (outOfStock) return;
    addToCart(product, quantity);
    toast.success(`Added ${quantity} × ${product.name} to cart`);
    openCartDrawer();
  };

  const handleBuyNow = () => {
    if (outOfStock) return;
    enterDirectBuy(product, quantity);
    router.push("/checkout");
  };

  const ratingForStars = Math.floor(product.averageRating ?? 0);

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 mt-24 md:mt-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <ProductGallery images={product.images} name={product.name} />

        {/* Product info */}
        <div className="space-y-4 md:space-y-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              <Link href={`/category/${product.category.id}`} className="hover:underline">
                {product.category.name}
              </Link>
            </p>
            <h1 className="gradient-text-semibold text-2xl md:text-3xl">{product.name}</h1>
            <div className="flex items-center mt-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 md:h-5 md:w-5 ${
                      i < ratingForStars
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="ml-2 text-xs md:text-sm text-gray-600">
                ({reviewsTotal} {reviewsTotal === 1 ? "review" : "reviews"})
              </span>
            </div>
          </div>

          <div className="flex items-baseline space-x-4">
            <p className="gradient-text-semibold text-3xl md:text-4xl">
              ₹{price.toLocaleString("en-IN")}
            </p>
            {hasDiscount && (
              <p className="text-base md:text-lg text-gray-500 line-through">
                ₹{original.toLocaleString("en-IN")}
              </p>
            )}
          </div>

          {/* Product Details accordion */}
          <Accordion type="single" collapsible defaultValue="product-details">
            <AccordionItem value="product-details">
              <AccordionTrigger>
                <h3 className="text-base md:text-lg mb-1 md:mb-2">Product Details</h3>
              </AccordionTrigger>
              <AccordionContent>
                <div className="prose max-w-none text-sm md:text-base">
                  {product.description && (
                    <p className="whitespace-pre-line">{product.description}</p>
                  )}
                  {product.features.length > 0 && (
                    <ul className="list-disc pl-5 space-y-1 text-sm md:text-base mt-4">
                      {product.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  )}
                  {product.benefits.length > 0 && (
                    <>
                      <h3 className="text-base md:text-lg mt-4">Benefits</h3>
                      <ul className="list-disc pl-5 space-y-1 text-sm md:text-base">
                        {product.benefits.map((benefit, index) => (
                          <li key={index}>{benefit}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Quantity + CTAs */}
          <div className="flex items-center gap-3 sm:space-x-4">
            <div className="border rounded-md flex items-center justify-end">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-1 border-r disabled:opacity-40"
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="px-4 py-1 tabular-nums">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}
                className="px-3 py-1 border-l disabled:opacity-40"
                disabled={quantity >= (product.stock || 99)}
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <GradientButton
              text={outOfStock ? "Out of stock" : "Add to Cart"}
              onClick={handleAddToCart}
              disabled={outOfStock}
              className="w-full"
            />

            <GradientButton
              text="Buy Now"
              onClick={handleBuyNow}
              disabled={outOfStock}
              gradient="from-orange-400 to-yellow-500"
              prefixIcon={<Zap fill="white" className="h-5 w-5" />}
              className="w-full hidden md:block"
            />
          </div>

          <GradientButton
            text="Buy Now"
            onClick={handleBuyNow}
            disabled={outOfStock}
            gradient="from-orange-400 to-yellow-500"
            prefixIcon={<Zap fill="white" className="h-5 w-5" />}
            className="w-full md:hidden"
          />

          {product.stock > 0 && product.stock <= 10 && (
            <p className="text-xs text-amber-700">
              Only {product.stock} left in stock — order soon.
            </p>
          )}
        </div>
      </div>

      {/* Timeline of reasons / usage / ideal / green / sustainability */}
      <ProductFeatures
        reasonsToBuy={product.reasonsToBuy ?? []}
        usage={product.usage ?? []}
        idealFor={product.idealFor ?? []}
        greenDiscounts={product.greenDiscounts ?? []}
        sustainability={product.sustainable ?? []}
      />

      {/* Reviews marquee */}
      <ProductReviews
        reviews={reviews}
        total={reviewsTotal}
        averageRating={product.averageRating ?? 0}
        speed="fast"
      />

      {/* FAQ + contact CTA */}
      <div className="flex flex-col md:flex-row md:space-x-10 justify-center items-center mt-10">
        {faq.length > 0 && (
          <div>
            <h2 className="gradient-text text-3xl md:text-4xl text-center mb-6">
              Frequently Asked Questions
            </h2>
            <ProductFaq items={faq} />
          </div>
        )}

        <div className="my-15 md:mb-50 text-center">
          <h2 className="gradient-text-semibold text-2xl md:text-3xl mb-2">
            Have any other queries?
          </h2>
          <p>Please feel free to contact us for any queries or concerns.</p>
          <Link href="/contact" className="mt-30 inline-block">
            <GradientButton text="Contact Us" onClick={() => {}} className="mt-5" />
          </Link>
        </div>
      </div>

      {/* Sticky bottom bar */}
      <BottomAddToCartBar product={product} />
    </div>
  );
}
