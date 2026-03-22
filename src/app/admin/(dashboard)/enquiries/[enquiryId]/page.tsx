import prismadb from "@/lib/prismadb";
import { EnquiryForm } from "./components/enquiry-form";

const EnquiryPage = async ({
  params
}: {
  params: Promise<{ enquiryId: string }>
}) => {
  const { enquiryId } = await params;

  const enquiry = await prismadb.distributorEnquiry.findUnique({
    where: {
      id: enquiryId
    }
  });

  return ( 
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <EnquiryForm initialData={enquiry} />
      </div>
    </div>
  );
}

export default EnquiryPage;
