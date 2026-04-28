import { format } from "date-fns";

import prismadb from "@/lib/prismadb";

import { BillboardColumn } from "./components/columns";
import { BillboardClient } from "./components/client";

const PAGE_SIZE = 50;

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

const BillboardsPage = async ({ searchParams }: PageProps) => {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [billboards, total] = await Promise.all([
    prismadb.billboard.findMany({
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip,
    }),
    prismadb.billboard.count(),
  ]);

  const formattedBillboards: BillboardColumn[] = billboards.map((item) => ({
    id: item.id,
    label: item.label,
    createdAt: format(item.createdAt, "MMMM do, yyyy"),
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <BillboardClient data={formattedBillboards} total={total} page={page} pageSize={PAGE_SIZE} />
      </div>
    </div>
  );
};

export default BillboardsPage;
