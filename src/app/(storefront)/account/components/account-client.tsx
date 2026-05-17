"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { Heart, MapPin, Package, User as UserIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";

import { OrdersTab } from "./orders-tab";
import { AddressesTab } from "./addresses-tab";
import { WishlistTab } from "./wishlist-tab";
import { ProfileTab } from "./profile-tab";

type Tab = "orders" | "addresses" | "wishlist" | "profile";

const TABS: { id: Tab; label: string; Icon: typeof Package }[] = [
  { id: "orders", label: "Orders", Icon: Package },
  { id: "addresses", label: "Addresses", Icon: MapPin },
  { id: "wishlist", label: "Wishlist", Icon: Heart },
  { id: "profile", label: "Profile", Icon: UserIcon },
];

export function AccountClient({ initialTab }: { initialTab: Tab }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { isAuthenticated, user, logout } = useAuthStore();
  const openLoginModal = useUIStore((s) => s.openLoginModal);
  const [tab, setTab] = useState<Tab>(initialTab);

  // Prompt sign-in if hitting /account unauthenticated
  useEffect(() => {
    if (!isAuthenticated) openLoginModal();
  }, [isAuthenticated, openLoginModal]);

  // Keep URL ?tab=… in sync with active tab.
  const changeTab = (next: Tab) => {
    setTab(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="rounded-2xl border bg-card p-12 text-center">
        <p className="text-lg font-medium mb-2">Sign in to view your account</p>
        <p className="text-sm text-muted-foreground mb-6">
          You&apos;ll see your orders, addresses, wishlist, and profile once you sign in.
        </p>
        <Button onClick={openLoginModal}>Sign in / Sign up</Button>
      </div>
    );
  }

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold">
            Hi{user.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{user.email || user.phone}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/explore">Keep shopping</Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => logout()} className="text-destructive">
            Sign out
          </Button>
        </div>
      </header>

      <Separator className="mb-6" />

      <TabsPrimitive.Root value={tab} onValueChange={(v) => changeTab(v as Tab)} className="space-y-6">
        <TabsPrimitive.List
          className="-mx-1 inline-flex flex-wrap items-center gap-1 rounded-full bg-muted p-1"
          aria-label="Account sections"
        >
          {TABS.map(({ id, label, Icon }) => (
            <TabsPrimitive.Trigger
              key={id}
              value={id}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                "data-[state=active]:bg-background data-[state=active]:shadow-sm",
                "text-muted-foreground data-[state=active]:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </TabsPrimitive.Trigger>
          ))}
        </TabsPrimitive.List>

        <TabsPrimitive.Content value="orders" className="focus:outline-none">
          <OrdersTab userId={user.id} />
        </TabsPrimitive.Content>
        <TabsPrimitive.Content value="addresses" className="focus:outline-none">
          <AddressesTab />
        </TabsPrimitive.Content>
        <TabsPrimitive.Content value="wishlist" className="focus:outline-none">
          <WishlistTab />
        </TabsPrimitive.Content>
        <TabsPrimitive.Content value="profile" className="focus:outline-none">
          <ProfileTab />
        </TabsPrimitive.Content>
      </TabsPrimitive.Root>
    </>
  );
}
