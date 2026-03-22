import { format } from "date-fns";
import prismadb from "@/lib/prismadb";
import { EnquiryClient } from "./components/client";
import { EnquiryColumn } from "./components/columns";

const EnquiriesPage = async () => {
  const enquiries = await prismadb.distributorEnquiry.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  });

  const formattedEnquiries: EnquiryColumn[] = enquiries.map((item) => ({
    id: item.id,
    name: item.name,
    email: item.email,
    phone: item.phone,
    companyName: item.companyName || 'N/A',
    status: item.status,
    createdAt: format(item.createdAt, 'MMMM do, yyyy'),
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <EnquiryClient data={formattedEnquiries} />
      </div>
    </div>
  );
};

export default EnquiriesPage;
