import "server-only";
import prismadb from "@/lib/prismadb";
import type { ProductSummary } from "@/types/storefront";

// ── Decimal → string serialization ───────────────────────────────────────
// Prisma's Decimal class can't cross the Server-Component → Client-Component
// boundary as-is (JSON.stringify produces an opaque struct). Convert every
// Decimal field to a string before returning so the props match
// `ProductSummary` (string-typed money fields) on the client.

type PrismaProductRow = Awaited<ReturnType<typeof prismadb.product.findFirst>>;

function serializeProduct<T extends NonNullable<PrismaProductRow>>(p: T) {
  return {
    ...p,
    price: p.price.toString(),
    b2bPrice: p.b2bPrice ? p.b2bPrice.toString() : null,
    originalPrice: p.originalPrice.toString(),
    deliveryPrice: p.deliveryPrice.toString(),
    gstRate: p.gstRate.toString(),
  };
}

/**
 * Public product listing — mirrors GET /api/products' read shape so the
 * storefront can render the same data without an extra HTTP round-trip.
 * Always filters out archived products.
 */
export async function getPublicProducts(params?: {
  categoryId?: string;
  isFeatured?: boolean;
  q?: string;
  take?: number;
  skip?: number;
}): Promise<{ products: ProductSummary[]; total: number }> {
  const take = Math.min(Math.max(params?.take ?? 50, 1), 100);
  const skip = Math.max(params?.skip ?? 0, 0);

  // FTS / substring fallback for the search query.
  let textFilter: any = undefined;
  const q = (params?.q ?? "").trim().slice(0, 100);
  if (q.length >= 2) {
    if (q.length < 3) {
      textFilter = {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      };
    } else {
      const search = q.split(/\s+/).filter(Boolean).join(" & ");
      textFilter = {
        OR: [{ name: { search } }, { description: { search } }],
      };
    }
  }

  const where: any = {
    isArchived: false,
    ...(params?.categoryId ? { categoryId: params.categoryId } : {}),
    ...(params?.isFeatured ? { isFeatured: true } : {}),
    ...(textFilter ?? {}),
  };

  const [rows, total] = await Promise.all([
    prismadb.product.findMany({
      where,
      include: {
        images: true,
        category: true,
        _count: { select: { reviews: true } },
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prismadb.product.count({ where }),
  ]);

  const productIds = rows.map((p) => p.id);
  const ratingMap = new Map<string, number | null>();
  if (productIds.length > 0) {
    const aggregations = await prismadb.review.groupBy({
      by: ["productId"],
      where: { productId: { in: productIds } },
      _avg: { rating: true },
    });
    for (const a of aggregations) ratingMap.set(a.productId, a._avg.rating);
  }

  const products = rows.map((p) => ({
    ...serializeProduct(p),
    averageRating: +Number(ratingMap.get(p.id) ?? 0).toFixed(2),
    totalReviews: p._count.reviews,
  })) as unknown as ProductSummary[];

  return { products, total };
}

/**
 * Single public product (with billboard for category context). Returns null
 * if archived or not found.
 */
export async function getPublicProduct(id: string) {
  const product = await prismadb.product.findFirst({
    where: { id, isArchived: false },
    include: {
      images: true,
      category: { include: { billboard: true } },
    },
  });
  if (!product) return null;

  const agg = await prismadb.review.aggregate({
    where: { productId: id },
    _avg: { rating: true },
    _count: true,
  });

  return {
    ...serializeProduct(product),
    category: product.category, // preserve the billboard include
    averageRating: +Number(agg._avg.rating ?? 0).toFixed(2),
    totalReviews: agg._count,
  };
}
