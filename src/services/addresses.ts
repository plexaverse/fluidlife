"use client";

import { safeDelete, safeGet, safePatch, safePost } from "./api-client";
import type { Address } from "@/types/storefront";

export interface AddressInput {
  address1: string;
  address2?: string;
  city: string;
  state: string;
  country: string;
  pincode?: string;
  landmark?: string;
  isDefault?: boolean;
}

export async function listAddresses(): Promise<Address[]> {
  return safeGet<Address[]>("/addresses");
}

export async function createAddress(input: AddressInput): Promise<Address> {
  return safePost<Address>("/addresses", input);
}

export async function updateAddress(id: string, input: Partial<AddressInput>): Promise<Address> {
  return safePatch<Address>(`/addresses/${id}`, input);
}

export async function deleteAddress(id: string): Promise<void> {
  await safeDelete(`/addresses/${id}`);
}
