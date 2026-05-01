import { redirect } from "next/navigation";
import { getDistributorSession } from "@/lib/distributor-auth";
import prismadb from "@/lib/prismadb";
import { formatter } from "@/lib/utils";

export default async function DistributorDashboard() {
  const session = await getDistributorSession();
  if (!session) redirect("/distributor/login");

  const user = await prismadb.user.findUnique({
    where: { id: session.userId },
    select: { name: true, companyName: true, creditLimit: true, creditUsed: true },
  });

  const stats = await prismadb.order.groupBy({
    by: ["status"],
    where: { userId: session.userId },
    _count: { id: true },
  });

  const total = await prismadb.order.aggregate({
    where: { userId: session.userId, isPaid: true },
    _sum: { amount: true },
  });

  const statusCounts = Object.fromEntries(stats.map((s) => [s.status, s._count.id]));
  const creditLimit = user?.creditLimit ? Number(user.creditLimit) : null;
  const creditUsed = user?.creditUsed ? Number(user.creditUsed) : 0;
  const creditPct = creditLimit ? Math.min(100, Math.round((creditUsed / creditLimit) * 100)) : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{user?.companyName || user?.name || "Dashboard"}</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back</p>
      </div>

      {creditLimit !== null && (
        <section className="bg-white dark:bg-neutral-900 rounded-xl border p-6 space-y-3">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-gray-500">Credit usage</h2>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold">{formatter.format(creditUsed)}</span>
            <span className="text-sm text-gray-500">of {formatter.format(creditLimit)} limit</span>
          </div>
          <div className="w-full h-2 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${creditPct! >= 90 ? "bg-red-500" : creditPct! >= 70 ? "bg-yellow-500" : "bg-emerald-500"}`}
              style={{ width: `${creditPct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400">{creditPct}% used — {formatter.format(creditLimit - creditUsed)} available</p>
        </section>
      )}

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total orders", value: stats.reduce((s, r) => s + r._count.id, 0) },
          { label: "Active", value: (statusCounts["ORDERED"] ?? 0) + (statusCounts["SHIPPED"] ?? 0) },
          { label: "Delivered", value: statusCounts["DELIVERED"] ?? 0 },
          { label: "Lifetime spend", value: formatter.format(Number(total._sum.amount ?? 0)) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white dark:bg-neutral-900 rounded-xl border p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
