"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";

const TOGGLE_ENABLED_PREFIXES = ["/admin", "/distributor"];

/**
 * Pathname-aware ThemeProvider.
 *
 *  - On `/admin/*` and `/distributor/*` it behaves like a normal next-themes
 *    provider — system default + dark/light toggle, persisted in localStorage.
 *  - Everywhere else (the customer storefront) it passes `forcedTheme="light"`,
 *    which makes next-themes ignore localStorage AND `prefers-color-scheme`
 *    and lock the html class to `light`. This is the recommended way to
 *    force a theme for a subtree.
 *
 * Implementation note: `forcedTheme` is reactive — when the user navigates
 * from /admin to /, next-themes re-applies "light"; on the way back, it
 * restores the user's stored preference. localStorage is never clobbered.
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const pathname = usePathname();
  const allowToggle = TOGGLE_ENABLED_PREFIXES.some((p) => pathname?.startsWith(p));

  return (
    <NextThemesProvider
      {...props}
      forcedTheme={allowToggle ? undefined : "light"}
    >
      {children}
    </NextThemesProvider>
  );
}
