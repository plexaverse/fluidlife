import { format } from "date-fns";
import Link from "next/link";

import prismadb from "@/lib/prismadb";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;

interface PageProps {
  searchParams: Promise<{ page?: string; source?: string }>;
}

const WebhooksPage = async ({ searchParams }: PageProps) => {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;
  const where: any = {};
  if (sp.source) where.source = sp.source;

  const [events, total] = await Promise.all([
    prismadb.webhookEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip,
    }),
    prismadb.webhookEvent.count({ where }),
  ]);

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Heading
          title={`Webhook events (${total})`}
          description="Idempotency cache. A row appearing here means we've processed that event id."
        />
        <Separator />

        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/admin/webhooks" className="underline-offset-4 hover:underline">
            All sources
          </Link>
          <Link href="/admin/webhooks?source=razorpay" className="underline-offset-4 hover:underline">
            Razorpay
          </Link>
          <Link href="/admin/webhooks?source=shiprocket" className="underline-offset-4 hover:underline">
            Shiprocket
          </Link>
        </div>

        <div className="border rounded-md overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2">When</th>
                <th className="text-left p-2">Source</th>
                <th className="text-left p-2">Event id</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 && (
                <tr>
                  <td className="p-4 text-center text-muted-foreground" colSpan={3}>
                    No webhook events recorded.
                  </td>
                </tr>
              )}
              {events.map((e) => (
                <tr key={e.id} className="border-t">
                  <td className="p-2 whitespace-nowrap">{format(e.createdAt, "MMM d, HH:mm:ss")}</td>
                  <td className="p-2">
                    <Badge variant="outline">{e.source}</Badge>
                  </td>
                  <td className="p-2 font-mono text-xs break-all">{e.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination total={total} page={page} pageSize={PAGE_SIZE} />
      </div>
    </div>
  );
};

export default WebhooksPage;
