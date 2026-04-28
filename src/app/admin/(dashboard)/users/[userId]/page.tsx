import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";

import prismadb from "@/lib/prismadb";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

import { UserForm } from "./components/user-form";

interface PageProps {
  params: Promise<{ userId: string }>;
}

const UserDetailPage = async ({ params }: PageProps) => {
  const { userId } = await params;

  const user = await prismadb.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      phone: true,
      name: true,
      email: true,
      role: true,
      companyName: true,
      gstNumber: true,
      isApproved: true,
      creditLimit: true,
      creditUsed: true,
      createdAt: true,
      deletedAt: true,
      _count: { select: { orders: true, addresses: true, reviews: true } },
    },
  });

  if (!user) notFound();

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex items-center justify-between">
          <Heading
            title={user.name || user.phone}
            description={`Joined ${format(user.createdAt, "PPP")} · ${user._count.orders} orders · ${user._count.addresses} addresses`}
          />
          <Button variant="outline" asChild>
            <Link href="/admin/users">Back to users</Link>
          </Button>
        </div>
        <Separator />

        <UserForm
          initialData={{
            id: user.id,
            phone: user.phone,
            name: user.name,
            email: user.email,
            role: user.role,
            companyName: user.companyName,
            gstNumber: user.gstNumber,
            isApproved: user.isApproved,
            creditLimit: user.creditLimit !== null ? Number(user.creditLimit) : null,
            creditUsed: Number(user.creditUsed),
          }}
        />
      </div>
    </div>
  );
};

export default UserDetailPage;
