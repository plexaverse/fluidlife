"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const routes = [
    { href: "/admin", label: "Overview", exact: true },
    { href: "/admin/billboards", label: "Billboards" },
    { href: "/admin/categories", label: "Categories" },
    { href: "/admin/products", label: "Products" },
    { href: "/admin/orders", label: "Orders" },
    { href: "/admin/coupons", label: "Coupons" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/enquiries", label: "Enquiries" },
    { href: "/admin/reviews", label: "Reviews" },
    { href: "/admin/reconcile", label: "Reconcile" },
    { href: "/admin/notifications", label: "Notifications" },
    { href: "/admin/webhooks", label: "Webhooks" },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[240px] sm:w-[300px]">
        <nav className="flex flex-col space-y-2 mt-4">
          {routes.map((route) => {
            const active = route.exact
              ? pathname === route.href
              : pathname === route.href || pathname.startsWith(route.href + "/");
            return (
              <Link
                key={route.href}
                href={route.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary px-2 py-2 rounded-md",
                  active
                    ? "bg-secondary text-black dark:text-white"
                    : "text-muted-foreground"
                )}
              >
                {route.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
