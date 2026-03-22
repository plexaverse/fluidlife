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
        {
            href: `/admin`,
            label: 'Overview',
            active: pathname === `/admin`,
        },
        {
            href: `/admin/billboards`,
            label: 'Billboards',
            active: pathname === `/admin/billboards`,
        },
        {
            href: `/admin/categories`,
            label: 'Categories',
            active: pathname === `/admin/categories`,
        },
        {
            href: `/admin/products`,
            label: 'Products',
            active: pathname === `/admin/products`,
        },
        {
            href: `/admin/orders`,
            label: 'Orders',
            active: pathname === `/admin/orders`,
        },
        {
            href: `/admin/coupons`,
            label: 'Coupons',
            active: pathname === `/admin/coupons`,
        },
        {
            href: `/admin/enquiries`,
            label: 'Enquiries',
            active: pathname === `/admin/enquiries`,
        },
        {
            href: `/admin/reviews`,
            label: 'Reviews',
            active: pathname === `/admin/reviews`,
        },
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
                <nav className="flex flex-col space-y-4 mt-4">
                    {routes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                                'text-sm font-medium transition-colors hover:text-primary px-2 py-2 rounded-md',
                                route.active
                                    ? 'bg-secondary text-black dark:text-white'
                                    : 'text-muted-foreground'
                            )}
                        >
                            {route.label}
                        </Link>
                    ))}
                </nav>
            </SheetContent>
        </Sheet>
    );
}
