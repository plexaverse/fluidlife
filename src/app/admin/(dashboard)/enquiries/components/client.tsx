"use client"

import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/ui/data-table";

import { EnquiryColumn, columns } from "./columns";

interface EnquiryClientProps {
  data: EnquiryColumn[];
}

export const EnquiryClient: React.FC<EnquiryClientProps> = ({
  data
}) => {
  return (
    <>
      <div className="flex items-center justify-between">
        <Heading
          title={`Enquiries (${data.length})`}
          description="Manage customer enquiries and contact requests"
        />
      </div>
      <Separator />
      <DataTable searchKey="email" columns={columns} data={data} />
    </>
  );
};
