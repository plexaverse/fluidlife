import "server-only";
import prismadb from "@/lib/prismadb";

/**
 * Public categories list — used by storefront nav, home, explore filters.
 * Includes billboard so cards can render the category image without an N+1.
 */
export async function getPublicCategories() {
  const categories = await prismadb.category.findMany({
    include: { billboard: true, _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    image: c.billboard?.imageUrl ?? null,
    productCount: c._count.products,
  }));
}

export async function getPublicCategory(id: string) {
  return prismadb.category.findUnique({
    where: { id },
    include: { billboard: true },
  });
}
