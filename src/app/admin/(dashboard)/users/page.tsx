import { format } from "date-fns";

import prismadb from "@/lib/prismadb";

import { UsersClient } from "./components/client";
import { UserColumn } from "./components/columns";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

interface PageProps {
  searchParams: Promise<{ page?: string; role?: string; isApproved?: string; q?: string }>;
}

const UsersPage = async ({ searchParams }: PageProps) => {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const where: any = { deletedAt: null };
  if (sp.role && ["CUSTOMER", "DISTRIBUTOR", "ADMIN"].includes(sp.role)) where.role = sp.role;
  if (sp.isApproved === "true") where.isApproved = true;
  if (sp.isApproved === "false") where.isApproved = false;
  if (sp.q) {
    const q = sp.q.trim().slice(0, 100);
    where.OR = [
      { phone: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { companyName: { contains: q, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prismadb.user.findMany({
      where,
      select: {
        id: true,
        phone: true,
        name: true,
        email: true,
        role: true,
        companyName: true,
        isApproved: true,
        creditLimit: true,
        creditUsed: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip,
    }),
    prismadb.user.count({ where }),
  ]);

  const formatted: UserColumn[] = users.map((u) => ({
    id: u.id,
    phone: u.phone,
    name: u.name,
    email: u.email,
    role: u.role,
    companyName: u.companyName ?? "",
    isApproved: u.isApproved,
    creditLimit: u.creditLimit !== null ? Number(u.creditLimit) : null,
    creditUsed: Number(u.creditUsed),
    createdAt: format(u.createdAt, "MMMM do, yyyy"),
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <UsersClient
          data={formatted}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          filters={{ role: sp.role, isApproved: sp.isApproved, q: sp.q }}
        />
      </div>
    </div>
  );
};

export default UsersPage;
