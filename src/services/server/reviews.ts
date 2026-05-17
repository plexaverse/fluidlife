import "server-only";
import prismadb from "@/lib/prismadb";

/**
 * Reviews for a product, paginated, with just enough user info to display
 * an author name without exposing PII.
 */
export async function getPublicReviews(params: {
  productId: string;
  take?: number;
  skip?: number;
}) {
  const take = Math.min(Math.max(params.take ?? 20, 1), 50);
  const skip = Math.max(params.skip ?? 0, 0);

  const [reviews, total] = await Promise.all([
    prismadb.review.findMany({
      where: { productId: params.productId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prismadb.review.count({ where: { productId: params.productId } }),
  ]);

  return {
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      authorName: r.user?.name ?? r.customerName ?? "Anonymous",
      createdAt: r.createdAt,
    })),
    total,
  };
}
