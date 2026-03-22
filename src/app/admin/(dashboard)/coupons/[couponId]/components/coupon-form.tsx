"use client"

import * as z from "zod"
import axios from "axios"
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "react-hot-toast"
import { Trash } from "lucide-react"
import { Coupon } from "@prisma/client"
import { useRouter } from "next/navigation"
import { format } from "date-fns"

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
import { Checkbox } from "@/components/ui/checkbox"

const formSchema = z.object({
  code: z.string().min(1, "Code is required"),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.coerce.number().min(0, "Value must be positive"),
  minOrderAmount: z.coerce.number().optional(),
  maxDiscount: z.coerce.number().optional(),
  usageLimit: z.coerce.number().optional(),
  validFrom: z.string().min(1, "Valid From is required"),
  validUntil: z.string().min(1, "Valid Until is required"),
  isActive: z.boolean().default(true),
});

type CouponFormValues = z.infer<typeof formSchema>

interface CouponFormProps {
  initialData: Coupon | null;
};

export const CouponForm: React.FC<CouponFormProps> = ({
  initialData
}) => {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const title = initialData ? 'Edit coupon' : 'Create coupon';
  const description = initialData ? 'Edit a coupon.' : 'Add a new coupon';
  const toastMessage = initialData ? 'Coupon updated.' : 'Coupon created.';
  const action = initialData ? 'Save changes' : 'Create';

  const defaultValues = initialData ? {
    code: initialData.code,
    discountType: initialData.discountType,
    discountValue: parseFloat(String(initialData.discountValue)),
    minOrderAmount: initialData.minOrderAmount ? parseFloat(String(initialData.minOrderAmount)) : undefined,
    maxDiscount: initialData.maxDiscount ? parseFloat(String(initialData.maxDiscount)) : undefined,
    usageLimit: initialData.usageLimit || undefined,
    validFrom: initialData.validFrom ? format(new Date(initialData.validFrom), "yyyy-MM-dd'T'HH:mm") : '',
    validUntil: initialData.validUntil ? format(new Date(initialData.validUntil), "yyyy-MM-dd'T'HH:mm") : '',
    isActive: initialData.isActive,
  } : {
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: 0,
    minOrderAmount: undefined,
    maxDiscount: undefined,
    usageLimit: undefined,
    validFrom: '',
    validUntil: '',
    isActive: true,
  }

  const form = useForm<CouponFormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: defaultValues as any,
  });

  const onSubmit = async (data: CouponFormValues) => {
    try {
      setLoading(true);
      const formattedData = {
        ...data,
        validFrom: new Date(data.validFrom).toISOString(),
        validUntil: new Date(data.validUntil).toISOString(),
      };

      if (initialData) {
        await axios.patch(`/api/coupons/${initialData.id}`, formattedData);
      } else {
        await axios.post(`/api/coupons`, formattedData);
      }
      router.refresh();
      router.push(`/admin/coupons`);
      toast.success(toastMessage);
    } catch (error: any) {
      toast.error('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`/api/coupons/${initialData?.id}`);
      router.refresh();
      router.push(`/admin/coupons`);
      toast.success('Coupon deleted.');
    } catch (error: any) {
      toast.error('Something went wrong.');
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
          <div className="md:grid md:grid-cols-3 gap-8">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                   <FormControl>
                    <Input disabled={loading} placeholder="SUMMER25" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="discountType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount Type</FormLabel>
                  <Select 
                    disabled={loading} 
                    onValueChange={field.onChange} 
                    value={field.value} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select discount type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                      <SelectItem value="FIXED">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="discountValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount Value</FormLabel>
                  <FormControl>
                    <Input type="number" disabled={loading} placeholder="25" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="minOrderAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Min Order Amount</FormLabel>
                  <FormControl>
                    <Input type="number" disabled={loading} placeholder="999" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maxDiscount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Discount Limit</FormLabel>
                  <FormControl>
                    <Input type="number" disabled={loading} placeholder="500" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="usageLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Usage Limit</FormLabel>
                  <FormControl>
                    <Input type="number" disabled={loading} placeholder="100" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="validFrom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valid From</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" disabled={loading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="validUntil"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valid Until</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" disabled={loading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      // @ts-ignore
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Active
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>
          <Button disabled={loading} className="ml-auto" type="submit">
            {action}
          </Button>
        </form>
      </Form>
    </>
  );
};
