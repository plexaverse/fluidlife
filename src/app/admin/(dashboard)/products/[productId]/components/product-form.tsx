"use client"

import * as z from "zod"
import axios from "axios"
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "react-hot-toast"
import { apiErrorMessage } from "@/lib/utils";
import { Trash } from "lucide-react"
import { Category, Image, Product } from "@prisma/client"
import { useRouter } from "next/navigation"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { Heading } from "@/components/ui/heading"
import { AlertModal } from "@/components/models/alert-modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ImageUpload from "@/components/ui/image-upload"
import { Checkbox } from "@/components/ui/checkbox"

const formSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  images: z.object({ url: z.string() }).array(),
  price: z.coerce.number().min(1),
  originalPrice: z.coerce.number().min(1),
  categoryId: z.string().min(1),
  stock: z.coerce.number().int().min(0).default(0),
  gstRate: z.coerce.number().min(0).max(28).default(18),
  hsnCode: z.string().optional(),
  isFeatured: z.boolean().default(false).optional(),
  isArchived: z.boolean().default(false).optional(),
  features: z.array(z.string()).default([]),
  reasonsToBuy: z.array(z.string()).default([]),
  idealFor: z.array(z.string()).default([]),
});

type ProductFormValues = z.infer<typeof formSchema>

interface ProductFormProps {
  initialData: Product & {
    images: Image[]
  } | null;
  categories: Category[];
};

export const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  categories,
}) => {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const title = initialData ? 'Edit product' : 'Create product';
  const description = initialData ? 'Edit a product.' : 'Add a new product';
  const toastMessage = initialData ? 'Product updated.' : 'Product created.';
  const action = initialData ? 'Save changes' : 'Create';

  const defaultValues = initialData ? {
    name: initialData.name,
    description: initialData.description || '',
    images: initialData.images.map((image) => ({ url: image.url })),
    price: parseFloat(String(initialData.price)),
    originalPrice: parseFloat(String(initialData.originalPrice)),
    categoryId: initialData.categoryId,
    stock: (initialData as any).stock ?? 0,
    gstRate: parseFloat(String((initialData as any).gstRate ?? 18)),
    hsnCode: (initialData as any).hsnCode ?? '',
    isFeatured: initialData.isFeatured,
    isArchived: initialData.isArchived,
    features: initialData.features || [],
    reasonsToBuy: initialData.reasonsToBuy || [],
    idealFor: initialData.idealFor || [],
  } : {
    name: '',
    description: '',
    images: [],
    price: 0,
    originalPrice: 0,
    categoryId: '',
    stock: 0,
    gstRate: 18,
    hsnCode: '',
    isFeatured: false,
    isArchived: false,
    features: [],
    reasonsToBuy: [],
    idealFor: [],
  }

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues
  });

  const onSubmit = async (data: ProductFormValues) => {
    try {
      setLoading(true);
      if (initialData) {
        await axios.patch(`/api/products/${initialData.id}`, data);
      } else {
        await axios.post(`/api/products`, data);
      }
      router.refresh();
      router.push(`/admin/products`);
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
      await axios.delete(`/api/products/${initialData?.id}`);
      router.refresh();
      router.push(`/admin/products`);
      toast.success('Product deleted.');
    } catch (error: any) {
      toast.error(apiErrorMessage(error, 'Something went wrong.'));
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }

  const renderArrayField = (name: "features" | "reasonsToBuy" | "idealFor", label: string) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="space-y-4">
              <div className="space-y-2">
              {(field.value as string[])?.map((item: string, index: number) => (
                <div key={index} className="flex flex-row items-center space-x-2">
                  <Input
                    value={item}
                    onChange={(e) => {
                      const newValue = [...(field.value as string[])];
                      newValue[index] = e.target.value;
                      field.onChange(newValue);
                    }}
                    placeholder={`${label} ${index + 1}`}
                  />
                    <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => {
                      const newValue = (field.value as string[]).filter((_, i) => i !== index);
                      field.onChange(newValue);
                    }}
                  >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  field.onChange([...(field.value as string[] || []), ""]);
                }}
              >
                Add {label}
              </Button>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

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
          <FormField
            control={form.control}
            name="images"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Images  (You can select more than one image)</FormLabel>
                <FormControl>
                  <ImageUpload
                    value={field.value.map((image) => image.url)}
                    disabled={loading}
                    onChange={(url) => field.onChange([...field.value, { url }])}
                    onRemove={(url) => field.onChange([...field.value.filter((current) => current.url !== url)])}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="md:grid md:grid-cols-3 gap-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input disabled={loading} placeholder="Product name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input disabled={loading} placeholder="Product description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input type="number" disabled={loading} placeholder="9.99" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="originalPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Original Price</FormLabel>
                  <FormControl>
                    <Input type="number" disabled={loading} placeholder="9.99" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select disabled={loading} onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue defaultValue={field.value} placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step={1} disabled={loading} placeholder="0" {...field} />
                  </FormControl>
                  <FormDescription>Units available for sale. Decremented atomically at checkout.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gstRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GST Rate (%)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} max={28} step={0.01} disabled={loading} placeholder="18" {...field} />
                  </FormControl>
                  <FormDescription>Listed price is GST-inclusive at this rate.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hsnCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>HSN Code</FormLabel>
                  <FormControl>
                    <Input disabled={loading} placeholder="e.g. 3401" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormDescription>Required on GST invoices.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isFeatured"
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
                      Featured
                    </FormLabel>
                    <FormDescription>
                      This product will appear on the home page
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isArchived"
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
                      Archived
                    </FormLabel>
                    <FormDescription>
                      This product will not appear anywhere in the store.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {renderArrayField("features", "Features")}
            {renderArrayField("reasonsToBuy", "Reasons to Buy")}
            {renderArrayField("idealFor", "Ideal For")}
          </div>

          <Button disabled={loading} className="ml-auto" type="submit">
            {action}
          </Button>
        </form>
      </Form>
    </>
  );
};
