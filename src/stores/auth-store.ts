"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { Address, User } from "@/types/storefront";

interface LoginPayload {
  token: string;
  refreshToken: string;
  /** Unix-second expiry timestamp returned by /api/auth/verifyotp */
  expiry: number;
  user: User;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  /** Unix-second timestamp at which `token` expires */
  expiry: number | null;
  isAuthenticated: boolean;
  user: User | null;

  login: (payload: LoginPayload) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setAddresses: (addresses: Address[]) => void;
  /** Apply a fresh access token (refresh flow) */
  setAccessToken: (token: string, expiry: number) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      expiry: null,
      isAuthenticated: false,
      user: null,

      login: ({ token, refreshToken, expiry, user }) =>
        set({ token, refreshToken, expiry, isAuthenticated: true, user }),

      logout: () =>
        set({ token: null, refreshToken: null, expiry: null, isAuthenticated: false, user: null }),

      setUser: (user) => set({ user }),

      setAddresses: (addresses) =>
        set((s) => (s.user ? { user: { ...s.user, addresses } } : {})),

      setAccessToken: (token, expiry) => set({ token, expiry }),
    }),
    {
      name: "fluidlife.auth",
      storage: createJSONStorage(() => localStorage),
      // Don't persist transient flags — recompute isAuthenticated from token at hydration.
      partialize: (s) => ({
        token: s.token,
        refreshToken: s.refreshToken,
        expiry: s.expiry,
        isAuthenticated: s.isAuthenticated,
        user: s.user,
      }),
    }
  )
);

/** Returns true if the current access token is still valid (expiry > now). */
export function isTokenValid(state: AuthState): boolean {
  if (!state.token || !state.expiry) return false;
  return state.expiry > Math.floor(Date.now() / 1000);
}
