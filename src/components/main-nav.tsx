"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();

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
    { href: "/admin/features", label: "Features" },
  ];

  return (
    <nav className={cn("flex items-center space-x-4 lg:space-x-6", className)} {...props}>
      {routes.map((route) => {
        const active = route.exact
          ? pathname === route.href
          : pathname === route.href || pathname.startsWith(route.href + "/");
        return (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              active ? "text-black dark:text-white" : "text-muted-foreground"
            )}
          >
            {route.label}
          </Link>
        );
      })}
    </nav>
  );
}
