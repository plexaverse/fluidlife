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
  searchParams: Promise<{ page?: string; status?: string; refType?: string; refId?: string }>;
}

const NotificationsPage = async ({ searchParams }: PageProps) => {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const where: any = {};
  if (sp.status === "sent" || sp.status === "failed") where.status = sp.status;
  if (sp.refType) where.refType = sp.refType;
  if (sp.refId) where.refId = sp.refId;

  const [logs, total] = await Promise.all([
    prismadb.notificationLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip,
    }),
    prismadb.notificationLog.count({ where }),
  ]);

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Heading
          title={`Notifications (${total})`}
          description="Outbound emails / SMS for orders and enquiries"
        />
        <Separator />

        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/admin/notifications" className="underline-offset-4 hover:underline">
            All
          </Link>
          <Link href="/admin/notifications?status=sent" className="underline-offset-4 hover:underline text-emerald-600">
            Sent
          </Link>
          <Link href="/admin/notifications?status=failed" className="underline-offset-4 hover:underline text-destructive">
            Failed
          </Link>
        </div>

        <div className="border rounded-md overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2">When</th>
                <th className="text-left p-2">Channel</th>
                <th className="text-left p-2">Template</th>
                <th className="text-left p-2">Recipient</th>
                <th className="text-left p-2">Ref</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Error</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr>
                  <td className="p-4 text-center text-muted-foreground" colSpan={7}>
                    No notifications recorded.
                  </td>
                </tr>
              )}
              {logs.map((l) => (
                <tr key={l.id} className="border-t align-top">
                  <td className="p-2 whitespace-nowrap">{format(l.createdAt, "MMM d, HH:mm:ss")}</td>
                  <td className="p-2">
                    <Badge variant="outline">{l.channel}</Badge>
                  </td>
                  <td className="p-2 font-mono text-xs">{l.template}</td>
                  <td className="p-2">{l.recipient}</td>
                  <td className="p-2 font-mono text-xs">
                    {l.refType}:{l.refId.slice(0, 8)}
                  </td>
                  <td className="p-2">
                    <Badge variant={l.status === "sent" ? "default" : "destructive"}>
                      {l.status}
                    </Badge>
                  </td>
                  <td className="p-2 text-xs text-muted-foreground max-w-xs truncate" title={l.error ?? ""}>
                    {l.error ?? ""}
                  </td>
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

export default NotificationsPage;
