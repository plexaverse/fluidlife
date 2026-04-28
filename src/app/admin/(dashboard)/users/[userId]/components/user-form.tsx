"use client";

import * as z from "zod";
import axios from "axios";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { apiErrorMessage } from "@/lib/utils";
import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { AlertModal } from "@/components/models/alert-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  companyName: z.string().optional(),
  gstNumber: z.string().optional(),
  role: z.enum(["CUSTOMER", "DISTRIBUTOR", "ADMIN"]),
  isApproved: z.boolean(),
  creditLimit: z.string().optional(), // string to allow empty / null
});

type FormValues = z.infer<typeof formSchema>;

interface UserFormProps {
  initialData: {
    id: string;
    phone: string;
    name: string;
    email: string;
    role: string;
    companyName: string | null;
    gstNumber: string | null;
    isApproved: boolean;
    creditLimit: number | null;
    creditUsed: number;
  };
}

export const UserForm: React.FC<UserFormProps> = ({ initialData }) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: initialData.name,
      email: initialData.email,
      companyName: initialData.companyName ?? "",
      gstNumber: initialData.gstNumber ?? "",
      role: initialData.role as any,
      isApproved: initialData.isApproved,
      creditLimit: initialData.creditLimit !== null ? String(initialData.creditLimit) : "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);
      const payload = {
        name: data.name,
        email: data.email,
        companyName: data.companyName ?? "",
        gstNumber: data.gstNumber ?? "",
        role: data.role,
        isApproved: data.isApproved,
        creditLimit: data.creditLimit?.trim() === "" ? null : Number(data.creditLimit),
      };
      await axios.put(`/api/users/${initialData.id}`, payload);
      router.refresh();
      toast.success("User updated.");
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to update user"));
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`/api/users/${initialData.id}`);
      router.refresh();
      router.push("/admin/users");
      toast.success("User soft-deleted.");
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to delete user"));
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onDelete}
        loading={loading}
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormItem>
              <FormLabel>Phone (immutable)</FormLabel>
              <Input value={initialData.phone} disabled />
            </FormItem>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input disabled={loading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" disabled={loading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select disabled={loading} onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CUSTOMER">Customer</SelectItem>
                      <SelectItem value="DISTRIBUTOR">Distributor</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company name</FormLabel>
                  <FormControl>
                    <Input disabled={loading} {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gstNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GSTIN</FormLabel>
                  <FormControl>
                    <Input disabled={loading} {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          <h3 className="text-lg font-semibold">Distributor settings</h3>
          <p className="text-sm text-muted-foreground">
            Only relevant when role is DISTRIBUTOR. Approval gates checkout; credit limit
            is enforced atomically on COD/BANK_TRANSFER orders.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="isApproved"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      // @ts-ignore
                      onCheckedChange={field.onChange}
                      disabled={loading}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Approved</FormLabel>
                    <FormDescription>
                      Unapproved distributors are blocked at checkout.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="creditLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credit limit (₹)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="Empty = no limit"
                      disabled={loading}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Currently used: ₹{initialData.creditUsed.toFixed(2)}. Leave blank for no limit.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <Button type="submit" disabled={loading}>Save changes</Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setOpen(true)}
              disabled={loading}
            >
              <Trash className="h-4 w-4 mr-1" /> Soft-delete user
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
};
