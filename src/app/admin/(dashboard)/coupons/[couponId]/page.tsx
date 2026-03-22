import prismadb from "@/lib/prismadb";
import { CouponForm } from "./components/coupon-form";

const CouponPage = async ({
  params
}: {
  params: Promise<{ couponId: string }>
}) => {
  const { couponId } = await params;

  const coupon = await prismadb.coupon.findUnique({
    where: {
      id: couponId
    }
  });

  return ( 
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <CouponForm initialData={coupon} />
      </div>
    </div>
  );
}

export default CouponPage;
