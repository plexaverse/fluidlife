"use client";

import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  authorName: string;
}

interface ReviewsMarqueeProps {
  reviews: ReviewItem[];
  speed?: "slow" | "normal" | "fast";
  /** Pause marquee on hover */
  pauseOnHover?: boolean;
}

/**
 * Infinite horizontal review marquee. Lightweight CSS-only implementation —
 * duplicates the list and animates `transform: translateX(-50%)` for
 * seamless looping. Inspired by Aceternity's infinite-moving-cards but
 * without the runtime DOM mutation.
 */
export function ReviewsMarquee({
  reviews,
  speed = "normal",
  pauseOnHover = true,
}: ReviewsMarqueeProps) {
  if (reviews.length === 0) return null;

  const duration = speed === "slow" ? "60s" : speed === "fast" ? "20s" : "40s";

  return (
    <section className="py-8">
      <p className="gradient-text-semibold text-3xl text-center py-2 mt-8 mb-6">
        Tried, Tested &amp; Loved
      </p>
      <div
        className={cn(
          "group relative overflow-hidden",
          "[mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
        )}
        style={{ ["--marquee-duration" as any]: duration }}
      >
        <ul
          className={cn(
            "flex w-max gap-4 py-4",
            "animate-[scroll_var(--marquee-duration)_linear_infinite]",
            pauseOnHover && "group-hover:[animation-play-state:paused]"
          )}
        >
          {[...reviews, ...reviews].map((review, idx) => (
            <li
              key={`${review.id}-${idx}`}
              className="w-[280px] md:w-[360px] shrink-0 rounded-2xl border bg-card p-5 shadow-sm"
            >
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={cn(
                      "h-4 w-4",
                      n <= review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"
                    )}
                  />
                ))}
              </div>
              {review.comment && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-4">{review.comment}</p>
              )}
              <p className="text-xs font-medium">— {review.authorName}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
