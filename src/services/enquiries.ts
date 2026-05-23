import { api } from "@/services/api-client";

export interface EnquiryPayload {
  name: string;
  email: string;
  phone: string;
  message: string;
  companyName?: string;
}

export interface EnquiryRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyName: string | null;
  message: string;
  createdAt: string;
}

/**
 * Submit a customer enquiry (contact form). Hits the public `/api/enquiries`
 * POST endpoint, which is rate-limited and writes to `DistributorEnquiry`.
 */
export async function submitEnquiry(payload: EnquiryPayload): Promise<EnquiryRecord> {
  const res = await api.post<EnquiryRecord>("/enquiries", payload);
  return res.data;
}
