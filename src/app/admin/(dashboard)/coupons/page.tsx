import { format } from "date-fns";
import prismadb from "@/lib/prismadb";
import { formatter } from "@/lib/utils";
import { CouponClient } from "./components/client";
import { CouponColumn } from "./components/columns";

const CouponsPage = async () => {
  const coupons = await prismadb.coupon.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  });

  const formattedCoupons: CouponColumn[] = coupons.map((item) => ({
    id: item.id,
    code: item.code,
    discountType: item.discountType,
    discountValue: item.discountType === 'PERCENTAGE' 
      ? `${item.discountValue}%` 
      : formatter.format(Number(item.discountValue)),
    usageCount: item.usedCount,
    usageLimit: item.usageLimit || 'Unlimited',
    validUntil: item.validUntil ? format(item.validUntil, 'MMMM do, yyyy') : 'No expiry',
    isActive: item.isActive,
    createdAt: format(item.createdAt, 'MMMM do, yyyy'),
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <CouponClient data={formattedCoupons} />
      </div>
    </div>
  );
};

export default CouponsPage;
