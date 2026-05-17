"use client";

import { safePost } from "./api-client";
import type { User } from "@/types/storefront";

export async function sendOtp(phone: string): Promise<void> {
  await safePost("/auth/sendotp", { phone });
}

export interface VerifyOtpResponse {
  token: string;
  refreshToken: string;
  /** Unix seconds */
  expiry: number;
  user: User;
}

export async function verifyOtp(phone: string, code: string): Promise<VerifyOtpResponse> {
  return safePost<VerifyOtpResponse>("/auth/verifyotp", { phone, code });
}

export interface RefreshResponse {
  token: string;
  expiry: number;
}

export async function refreshAccessToken(refreshToken: string): Promise<RefreshResponse> {
  return safePost<RefreshResponse>("/auth/refresh", { refreshToken });
}
