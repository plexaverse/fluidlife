"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Zap } from "lucide-react";

import { GradientButton } from "@/components/ui/gradient-button";
import { useCartStore } from "@/stores/cart-store";
import type { ProductSummary } from "@/types/storefront";

interface InnovationProductProps {
  /** The "hero" product to highlight — typically the first isFeatured product. Pass null to skip rendering. */
  product: ProductSummary | null;
  /** Selling-point bullets shown on the right. Sensible defaults provided. */
  bullets?: string[];
  /** Section title above the layout. */
  title?: string;
}

const DEFAULT_BULLETS = [
  "Formulated with dermatologists and gynaecologists",
  "Sensitive formula for sensitive areas — itch-free",
  "Fights stains — period, discharge, and more",
  "Anti-fungal properties",
  "Keeps garments soft",
  "Both hand- and machine-washable",
  "Plant-based, toxin-free, biodegradable formula",
];

/**
 * "Our Innovations" — image-left, bullets-right product highlight with
 * staggered reveal. Mirrors takekare's InnovationProduct layout. The product
 * is passed in so the page (a Server Component) can pick the hero — typically
 * the first isFeatured entry.
 */
export function InnovationProduct({ product, bullets = DEFAULT_BULLETS, title = "Our Innovations" }: InnovationProductProps) {
  const router = useRouter();
  const addToCart = useCartStore((s) => s.addToCart);
  const [visible, setVisible] = useState(false);
  const [visibleItems, setVisibleItems] = useState<number[]>([]);

  useEffect(() => {
    const onScroll = () => {
      const el = document.getElementById("innovation-product");
      if (el && el.getBoundingClientRect().top < window.innerHeight) {
        setVisible(true);
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!visible) return;
    bullets.forEach((_, idx) => {
      setTimeout(() => setVisibleItems((p) => [...p, idx]), idx * 300);
    });
  }, [visible, bullets]);

  if (!product) return null;

  const image = product.images[0]?.url;

  return (
    <section id="innovation-product" className="py-16 px-4 md:px-10">
      <h4 className="gradient-text-semibold text-3xl text-center mb-8">{title}</h4>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="h-full w-full">
          {image ? (
            <Image
              src={image}
              alt={product.name}
              className="relative object-contain mx-auto"
              width={800}
              height={900}
            />
          ) : (
            <div className="aspect-square w-full max-w-md mx-auto rounded-2xl brand-gradient opacity-20" />
          )}
        </div>

        <div className="text-left">
          <h4 className="gradient-text-semibold text-2xl text-center md:text-left mb-6">
            {product.name}
          </h4>
          <ul className="space-y-5 text-muted-foreground text-base md:text-lg">
            {bullets.map((item, idx) => (
              <li
                key={idx}
                className={`flex items-start gap-2 transition-all duration-1200 ${
                  visibleItems.includes(idx)
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                }`}
              >
                <span className="text-lg leading-none mt-1">◦</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col md:flex-row gap-4 mt-8">
            <GradientButton
              text="View Product"
              onClick={() => router.push(`/product/${product.id}`)}
            />
            <GradientButton
              text="Buy Now"
              gradient="from-orange-400 to-yellow-500"
              prefixIcon={<Zap fill="white" className="h-5 w-5" />}
              onClick={() => {
                addToCart(product, 1);
                router.push("/checkout");
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
