"use client";

import { safeDelete, safeGet, safePost } from "./api-client";
import type { ProductSummary } from "@/types/storefront";

export interface WishlistEntry {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
  product: ProductSummary;
}

export async function listWishlist(): Promise<WishlistEntry[]> {
  return safeGet<WishlistEntry[]>("/wishlist");
}

export async function addToWishlist(productId: string): Promise<WishlistEntry> {
  return safePost<WishlistEntry>("/wishlist", { productId });
}

export async function removeFromWishlist(productId: string): Promise<void> {
  await safeDelete(`/wishlist?productId=${encodeURIComponent(productId)}`);
}
