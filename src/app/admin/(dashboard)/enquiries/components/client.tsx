"use client";

import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";

import { EnquiryColumn, columns } from "./columns";

interface EnquiryClientProps {
  data: EnquiryColumn[];
  total: number;
  page: number;
  pageSize: number;
}

export const EnquiryClient: React.FC<EnquiryClientProps> = ({
  data,
  total,
  page,
  pageSize,
}) => {
  return (
    <>
      <div className="flex items-center justify-between">
        <Heading
          title={`Enquiries (${total})`}
          description="Manage customer enquiries and contact requests"
        />
      </div>
      <Separator />
      <DataTable searchKey="email" columns={columns} data={data} />
      <Pagination total={total} page={page} pageSize={pageSize} />
    </>
  );
};
