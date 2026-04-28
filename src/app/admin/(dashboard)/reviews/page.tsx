import { format } from "date-fns";

import prismadb from "@/lib/prismadb";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";

import { ReviewsClient } from "./components/client";
import { ReviewColumn } from "./components/columns";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

interface PageProps {
  searchParams: Promise<{ page?: string; productId?: string; rating?: string }>;
}

const ReviewsPage = async ({ searchParams }: PageProps) => {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const where: any = {};
  if (sp.productId) where.productId = sp.productId;
  const ratingNum = sp.rating ? Number(sp.rating) : NaN;
  if (Number.isInteger(ratingNum) && ratingNum >= 1 && ratingNum <= 5) {
    where.rating = ratingNum;
  }

  const [reviews, total] = await Promise.all([
    prismadb.review.findMany({
      where,
      include: {
        product: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip,
    }),
    prismadb.review.count({ where }),
  ]);

  const formatted: ReviewColumn[] = reviews.map((r) => ({
    id: r.id,
    productId: r.product.id,
    productName: r.product.name,
    rating: r.rating,
    comment: r.comment ?? "",
    customerName: r.user?.name ?? r.customerName ?? "Anonymous",
    customerPhone: r.user?.phone ?? "",
    userId: r.user?.id ?? null,
    createdAt: format(r.createdAt, "MMMM do, yyyy"),
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Heading
          title={`Reviews (${total})`}
          description="Moderate customer reviews. Removal is permanent."
        />
        <Separator />
        <ReviewsClient
          data={formatted}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          filters={{ productId: sp.productId, rating: sp.rating }}
        />
      </div>
    </div>
  );
};

export default ReviewsPage;
