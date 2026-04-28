"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

interface PaginationProps {
  total: number;
  page: number;
  pageSize: number;
}

/**
 * URL-driven pagination. Updates `?page=` in place; works inside Server
 * Components because the actual links are <Link>s.
 */
export const Pagination: React.FC<PaginationProps> = ({ total, page, pageSize }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (totalPages <= 1) return null;

  const buildHref = (target: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (target <= 1) params.delete("page");
    else params.set("page", String(target));
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const prev = Math.max(1, page - 1);
  const next = Math.min(totalPages, page + 1);
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-sm text-muted-foreground">
        Showing {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
          {page > 1 ? (
            <Link href={buildHref(prev)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Link>
          ) : (
            <span>
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </span>
          )}
        </Button>
        <span className="text-sm text-muted-foreground tabular-nums px-2">
          Page {page} of {totalPages}
        </span>
        <Button variant="outline" size="sm" disabled={page >= totalPages} asChild={page < totalPages}>
          {page < totalPages ? (
            <Link href={buildHref(next)}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          ) : (
            <span>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </span>
          )}
        </Button>
      </div>
    </div>
  );
};
