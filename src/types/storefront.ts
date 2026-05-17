// Plain TypeScript shapes shared between zustand stores, components, and API
// callers. Mirrors the fluidlife backend response shapes from src/app/api/*.

export type UserRole = "CUSTOMER" | "DISTRIBUTOR" | "ADMIN";

export interface Address {
  id: string;
  address1: string;
  address2: string | null;
  city: string;
  state: string;
  country: string;
  pincode: string | null;
  landmark: string | null;
  isDefault: boolean;
  userId: string;
}

export interface User {
  id: string;
  phone: string;
  name: string;
  email: string;
  role: UserRole;
  companyName: string | null;
  gstNumber: string | null;
  isApproved: boolean;
  creditLimit: number | null;
  creditUsed: number;
  addresses?: Address[];
}

export interface ProductImage {
  id: string;
  url: string;
  productId: string;
}

export interface ProductSummary {
  id: string;
  name: string;
  description: string | null;
  price: string;          // Prisma Decimal arrives as string
  b2bPrice: string | null;
  originalPrice: string;
  deliveryPrice: string;
  stock: number;
  moq: number;
  gstRate: string;
  hsnCode: string | null;
  isFeatured: boolean;
  isArchived: boolean;
  weight: number;
  length: number;
  breadth: number;
  height: number;
  categoryId: string;
  images: ProductImage[];
  averageRating?: number;
  totalReviews?: number;
}

export interface CartItem {
  /** Client-generated UUID — stable across reloads while the line is in the cart */
  id: string;
  productId: string;
  product: ProductSummary;
  quantity: number;
  /** Computed: priceAtCart × quantity. Kept in state for cheap totals. */
  totalPrice: number;
  addedAt: string; // ISO timestamp
}

export type CheckoutStep = "info" | "address" | "payment";
export type PaymentMethod = "cod" | "prepaid";

export interface CheckoutInfo {
  name: string;
  phone: string;
  email: string;
}

export interface CheckoutAddressInput {
  pinCode: string;
  address1: string;
  address2: string;
  landmark: string;
  state: string;
}
