import { format } from "date-fns";
import prismadb from "@/lib/prismadb";
import { EnquiryClient } from "./components/client";
import { EnquiryColumn } from "./components/columns";

const PAGE_SIZE = 50;

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

const EnquiriesPage = async ({ searchParams }: PageProps) => {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [enquiries, total] = await Promise.all([
    prismadb.distributorEnquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip,
    }),
    prismadb.distributorEnquiry.count(),
  ]);

  const formattedEnquiries: EnquiryColumn[] = enquiries.map((item) => ({
    id: item.id,
    name: item.name,
    email: item.email,
    phone: item.phone,
    companyName: item.companyName || "N/A",
    status: item.status,
    createdAt: format(item.createdAt, "MMMM do, yyyy"),
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <EnquiryClient data={formattedEnquiries} total={total} page={page} pageSize={PAGE_SIZE} />
      </div>
    </div>
  );
};

export default EnquiriesPage;
