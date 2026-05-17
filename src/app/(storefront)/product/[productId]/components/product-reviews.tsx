import { format } from "date-fns";
import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

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
}

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  return (
    <div className="inline-flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            size === "sm" ? "h-4 w-4" : "h-5 w-5",
            n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"
          )}
        />
      ))}
    </div>
  );
}

export function ProductReviews({ reviews, total, averageRating }: ProductReviewsProps) {
  return (
    <section className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold">Customer reviews</h2>
          {total > 0 && (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Stars rating={Math.round(averageRating)} size="lg" />
              <span className="tabular-nums">
                {averageRating.toFixed(1)} out of 5 · {total} {total === 1 ? "review" : "reviews"}
              </span>
            </div>
          )}
        </div>
      </header>

      {reviews.length === 0 ? (
        <p className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
          No reviews yet. Be the first to share your experience.
        </p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-2xl border bg-card p-5">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <Stars rating={r.rating} />
                  <span className="text-sm font-medium">{r.authorName}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(r.createdAt, "PPP")}
                </span>
              </div>
              {r.comment && (
                <p className="text-sm text-muted-foreground whitespace-pre-line">{r.comment}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
