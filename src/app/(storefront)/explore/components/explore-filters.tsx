"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";

interface ExploreFiltersProps {
  initial: { q?: string };
}

/**
 * Search-only filter row. Category filtering lives in `CategoryTabs` above
 * (URL-driven so the page stays server-rendered). Enter submits, the inline
 * × clears.
 */
export function ExploreFilters({ initial }: ExploreFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(initial.q ?? "");

  const submit = (next: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (next) params.set("q", next);
    else params.delete("q");
    const qs = params.toString();
    router.push(qs ? `/explore?${qs}` : "/explore");
  };

  return (
    <div className="relative max-w-xl">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search products"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit(q.trim() || undefined);
        }}
        className="pl-9 pr-9 rounded-full"
      />
      {q && (
        <button
          type="button"
          onClick={() => {
            setQ("");
            submit(undefined);
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
