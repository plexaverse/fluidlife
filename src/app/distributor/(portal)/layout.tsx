import { redirect } from "next/navigation";
import { getDistributorSession } from "@/lib/distributor-auth";
import { DistributorNav } from "../components/nav";

export const metadata = { title: "Distributor Portal — Fluidlife" };

export default async function DistributorPortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getDistributorSession();
  if (!session) redirect("/distributor/login");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      <DistributorNav userId={session.userId} />
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
