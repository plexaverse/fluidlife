import { format } from "date-fns";
import prismadb from "@/lib/prismadb";
import { formatter } from "@/lib/utils";
import { CouponClient } from "./components/client";
import { CouponColumn } from "./components/columns";

const PAGE_SIZE = 50;

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

const CouponsPage = async ({ searchParams }: PageProps) => {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [coupons, total] = await Promise.all([
    prismadb.coupon.findMany({
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip,
    }),
    prismadb.coupon.count(),
  ]);

  const formattedCoupons: CouponColumn[] = coupons.map((item) => ({
    id: item.id,
    code: item.code,
    discountType: item.discountType,
    discountValue:
      item.discountType === "PERCENTAGE"
        ? `${item.discountValue}%`
        : formatter.format(Number(item.discountValue)),
    usageCount: item.usedCount,
    usageLimit: item.usageLimit || "Unlimited",
    validUntil: item.validUntil ? format(item.validUntil, "MMMM do, yyyy") : "No expiry",
    isActive: item.isActive,
    createdAt: format(item.createdAt, "MMMM do, yyyy"),
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <CouponClient data={formattedCoupons} total={total} page={page} pageSize={PAGE_SIZE} />
      </div>
    </div>
  );
};

export default CouponsPage;
