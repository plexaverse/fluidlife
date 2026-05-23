"use client";

import { Star } from "lucide-react";

import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";

interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  authorName: string;
  createdAt: Date;
}

interface ProductReviewsProps {
  reviews: ReviewItem[];
  total: number;
  averageRating: number;
  /** Marquee speed; defaults to fast. */
  speed?: "fast" | "normal" | "slow";
}

/**
 * Takekare-style review marquee. Falls back to a centred empty state when
 * there are no reviews yet.
 */
export function ProductReviews({ reviews, speed = "fast" }: ProductReviewsProps) {
  const items = reviews
    .filter((r) => r.comment && r.comment.trim().length > 0)
    .map((r) => ({
      quote: r.comment ?? "",
      name: r.authorName,
      title: (
        <div className="flex items-center flex-wrap">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-3 w-3 md:h-4 md:w-4 ${
                i < r.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
              }`}
            />
          ))}
          <span className="ml-2 text-xs text-gray-500">
            {r.createdAt.toLocaleDateString()}
          </span>
        </div>
      ),
    }));

  return (
    <div className="h-auto md:h-[20rem] rounded-md flex flex-col antialiased bg-white dark:bg-black items-center justify-center relative overflow-hidden p-4">
      {items.length > 0 ? (
        <InfiniteMovingCards items={items} direction="left" speed={speed} />
      ) : (
        <div className="text-center p-4">
          <p className="text-lg font-medium">No reviews yet for this product.</p>
          <p className="text-sm text-gray-500 mt-2">Be the first to leave a review!</p>
        </div>
      )}
    </div>
  );
}
