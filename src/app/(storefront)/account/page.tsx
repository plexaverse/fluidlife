import type { Metadata } from "next";

import { AccountClient } from "./components/account-client";

export const metadata: Metadata = {
  title: "My account",
  description: "Manage your orders, addresses, wishlist, and profile.",
};

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

const VALID_TABS = ["orders", "addresses", "wishlist", "profile"] as const;
type Tab = (typeof VALID_TABS)[number];

export default async function AccountPage({ searchParams }: PageProps) {
  const { tab } = await searchParams;
  const initialTab: Tab =
    tab && (VALID_TABS as readonly string[]).includes(tab) ? (tab as Tab) : "orders";

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8 md:py-12">
      <AccountClient initialTab={initialTab} />
    </div>
  );
}
