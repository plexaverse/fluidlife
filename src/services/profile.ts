"use client";

import { safeGet, safePut } from "./api-client";
import type { User } from "@/types/storefront";

export interface ProfileUpdateInput {
  name?: string;
  email?: string;
  companyName?: string | null;
  gstNumber?: string | null;
}

export async function getMyProfile(userId: string): Promise<User> {
  return safeGet<User>(`/users/${userId}`);
}

export async function updateProfile(userId: string, input: ProfileUpdateInput): Promise<User> {
  return safePut<User>(`/users/${userId}`, input);
}
