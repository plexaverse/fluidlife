"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

interface CategoryTabsProps {
  categories: { id: string; name: string }[];
  activeId?: string;
}

/**
 * Horizontal pill row of category filters. Mirrors takekare's Tabs UX but
 * driven by URL params so the explore page stays server-rendered and shareable.
 *
 * On mobile the row scrolls horizontally; on `sm+` it stretches to fill the
 * container. Switching a tab preserves any existing search (`?q=`) but drops
 * the page param to land back on page 1.
 */
export function CategoryTabs({ categories, activeId }: CategoryTabsProps) {
  const searchParams = useSearchParams();

  const buildHref = (id?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (id) params.set("categoryId", id);
    else params.delete("categoryId");
    const qs = params.toString();
    return qs ? `/explore?${qs}` : "/explore";
  };

  const tabs = [{ id: undefined, name: "All" }, ...categories.map((c) => ({ id: c.id, name: c.name }))];

  return (
    <div className="w-full overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
      <div className="inline-flex sm:flex sm:w-full gap-1 rounded-full bg-muted/60 p-1 backdrop-blur-sm">
        {tabs.map((tab) => {
          const isActive = (tab.id ?? "") === (activeId ?? "");
          return (
            <Link
              key={tab.id ?? "all"}
              href={buildHref(tab.id)}
              className={cn(
                "whitespace-nowrap flex-1 text-center text-xs sm:text-sm px-4 py-2 rounded-full transition-all",
                isActive
                  ? "bg-white text-foreground shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
