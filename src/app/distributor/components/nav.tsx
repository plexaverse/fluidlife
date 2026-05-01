"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { LayoutDashboard, ShoppingBag, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/distributor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/distributor/orders", label: "Orders", icon: ShoppingBag },
];

export function DistributorNav({ userId: _userId }: { userId: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    try {
      await axios.delete("/api/distributor/session");
    } catch {}
    router.push("/distributor/login");
    router.refresh();
  };

  return (
    <nav className="border-b bg-white dark:bg-neutral-900 px-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between h-14">
        <div className="flex items-center gap-1">
          <span className="font-bold text-lg mr-6">Fluidlife</span>
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname.startsWith(href)
                  ? "bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white"
                  : "text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </nav>
  );
}
