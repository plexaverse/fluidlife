"use client"

import * as z from "zod"
import axios from "axios"
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "react-hot-toast"
import { apiErrorMessage } from "@/lib/utils";
import { Trash } from "lucide-react"
import { DistributorEnquiry } from "@prisma/client"
import { useRouter } from "next/navigation"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { Heading } from "@/components/ui/heading"
import { AlertModal } from "@/components/models/alert-modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const formSchema = z.object({
  status: z.enum(["PENDING", "REVIEWED", "RESOLVED"]),
});

type EnquiryFormValues = z.infer<typeof formSchema>

interface EnquiryFormProps {
  initialData: DistributorEnquiry | null;
};

export const EnquiryForm: React.FC<EnquiryFormProps> = ({
  initialData
}) => {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const title = initialData ? 'View/Update enquiry' : 'Create enquiry';
  const description = initialData ? 'Manage this customer enquiry.' : 'Add a new enquiry';
  const toastMessage = initialData ? 'Enquiry updated.' : 'Enquiry created.';
  const action = initialData ? 'Save changes' : 'Create';

  const defaultValues = initialData ? {
    status: initialData.status,
  } : {
    status: 'PENDING',
  }

  const form = useForm<EnquiryFormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: defaultValues as any,
  });

  const onSubmit = async (data: EnquiryFormValues) => {
    try {
      setLoading(true);
      if (initialData) {
        await axios.patch(`/api/enquiries/${initialData.id}`, data);
      } else {
        await axios.post(`/api/enquiries`, data);
      }
      router.refresh();
      router.push(`/admin/enquiries`);
      toast.success(toastMessage);
    } catch (error: any) {
      toast.error(apiErrorMessage(error, 'Something went wrong.'));
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`/api/enquiries/${initialData?.id}`);
      router.refresh();
      router.push(`/admin/enquiries`);
      toast.success('Enquiry deleted.');
    } catch (error: any) {
      toast.error(apiErrorMessage(error, 'Something went wrong.'));
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }

  return (
    <>
    <AlertModal 
      isOpen={open} 
      onClose={() => setOpen(false)}
      onConfirm={onDelete}
      loading={loading}
    />
     <div className="flex items-center justify-between">
        <Heading title={title} description={description} />
        {initialData && (
          <Button
            disabled={loading}
            variant="destructive"
            size="sm"
            onClick={() => setOpen(true)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Separator />

      {/* Read-only details displaying the enquiry */}
      {initialData && (
        <div className="grid grid-cols-2 gap-8 mb-8 mt-4 rounded-lg bg-slate-50 p-6 border">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Name</p>
              <p className="font-medium">{initialData.name}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Email</p>
              <p className="font-medium">{initialData.email}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Phone</p>
              <p className="font-medium">{initialData.phone}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Company Name</p>
              <p className="font-medium">{initialData.companyName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Message</p>
              <p className="font-medium mt-1 whitespace-pre-wrap">{initialData.message}</p>
            </div>
          </div>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full max-w-sm">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status Registration</FormLabel>
                <Select 
                  disabled={loading} 
                  onValueChange={field.onChange} 
                  value={field.value} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="REVIEWED">Reviewed</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button disabled={loading} type="submit">
            {action}
          </Button>
        </form>
      </Form>
    </>
  );
};
