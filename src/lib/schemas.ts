import { z } from "zod";

const trimmed = z.string().trim();
const nonEmpty = trimmed.min(1);
export const idSchema = trimmed.min(1);
export const phoneSchema = trimmed.regex(/^[1-9]\d{9,14}$/, { error: "Invalid phone number" });
export const emailSchema = z.email();

const decimalLike = z
  .union([z.number(), z.string()])
  .transform((v) => String(v).trim())
  .refine((s) => /^\d+(\.\d+)?$/.test(s), { error: "Must be a non-negative decimal" });

const stringArray = z.array(z.string()).default([]);
const positiveInt = z.number().int().positive();
const nonNegativeInt = z.number().int().nonnegative();

// ───── Products ─────

export const productCreateSchema = z.object({
  name: nonEmpty,
  categoryId: idSchema,
  price: decimalLike,
  description: trimmed.optional(),
  features: stringArray,
  benefits: stringArray,
  usage: stringArray,
  idealFor: stringArray,
  reasonsToBuy: stringArray,
  greenDiscounts: stringArray,
  sustainable: stringArray,
  faq: z.unknown().default([]),
  certifications: stringArray,
  b2bPrice: decimalLike.optional(),
  moq: positiveInt.default(1),
  originalPrice: decimalLike.default("0"),
  deliveryPrice: decimalLike.default("0"),
  stock: nonNegativeInt.default(0),
  isFeatured: z.boolean().default(false),
  isArchived: z.boolean().default(false),
  length: nonNegativeInt.default(0),
  breadth: nonNegativeInt.default(0),
  height: nonNegativeInt.default(0),
  weight: nonNegativeInt.default(0),
  gstRate: z.coerce.number().min(0).max(28).default(18),
  hsnCode: trimmed.optional(),
  images: z.array(z.object({ url: z.url() })).default([]),
});

export const productUpdateSchema = z.object({
  name: nonEmpty,
  categoryId: idSchema,
  price: decimalLike,
  description: trimmed.nullable().optional(),
  originalPrice: decimalLike.optional(),
  isFeatured: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  stock: nonNegativeInt.optional(),
  gstRate: z.coerce.number().min(0).max(28).optional(),
  hsnCode: trimmed.nullable().optional(),
  b2bPrice: decimalLike.optional(),
  moq: positiveInt.optional(),
  deliveryPrice: decimalLike.optional(),
  length: nonNegativeInt.optional(),
  breadth: nonNegativeInt.optional(),
  height: nonNegativeInt.optional(),
  weight: nonNegativeInt.optional(),
  features: stringArray.optional(),
  reasonsToBuy: stringArray.optional(),
  idealFor: stringArray.optional(),
  images: z.array(z.object({ url: z.url() })).min(1, { error: "At least one image required" }),
});

// ───── Coupons ─────

export const couponSchema = z
  .object({
    code: nonEmpty.transform((s) => s.toUpperCase()),
    discountType: z.enum(["PERCENTAGE", "FIXED"]),
    discountValue: z.number().positive(),
    minOrderAmount: nonNegativeInt.nullable().optional(),
    maxDiscount: nonNegativeInt.nullable().optional(),
    usageLimit: positiveInt.nullable().optional(),
    validFrom: z.coerce.date(),
    validUntil: z.coerce.date(),
    isActive: z.boolean().default(true),
  })
  .refine((d) => d.validUntil > d.validFrom, {
    error: "validUntil must be after validFrom",
    path: ["validUntil"],
  })
  .refine((d) => d.discountType !== "PERCENTAGE" || d.discountValue <= 100, {
    error: "Percentage discount must be <= 100",
    path: ["discountValue"],
  });

// ───── Enquiries ─────

export const enquiryCreateSchema = z.object({
  name: nonEmpty,
  email: emailSchema,
  phone: phoneSchema,
  message: trimmed.min(1).max(2000),
  companyName: trimmed.optional(),
});

export const enquiryStatusSchema = z.object({
  status: z.enum(["PENDING", "CONTACTED", "CONVERTED", "REJECTED"]),
});

// ───── Checkout ─────

export const checkoutSchema = z.object({
  addressId: idSchema,
  paymentType: z.enum(["PREPAID", "COD", "UPI", "BANK_TRANSFER"]).default("PREPAID"),
  couponCode: trimmed
    .min(1)
    .transform((s) => s.toUpperCase())
    .optional(),
  idempotencyKey: trimmed.min(8).max(128).optional(),
  // Optional client-provided delivery amount (e.g. quoted via Shiprocket rate API).
  // Server clamps to [0, 10000] and zeroes it out if the subtotal exceeds the free-shipping threshold.
  deliveryAmount: z.number().nonnegative().max(10000).optional(),
  items: z
    .array(z.object({ productId: idSchema, quantity: positiveInt }))
    .min(1, { error: "At least one item required" })
    .max(100, { error: "Too many items" }),
});
