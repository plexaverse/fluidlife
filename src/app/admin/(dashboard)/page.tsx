import prismadb from "@/lib/prismadb"

export default async function AdminOverview() {
  
  // Aggregations mapping
  const totalRevenue = await prismadb.order.aggregate({
    where: { isPaid: true },
    _sum: { amount: true }
  });

  const salesCount = await prismadb.order.count({
    where: { isPaid: true }
  });

  const stockCount = await prismadb.product.count({
    where: { isArchived: false }
  });

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-6 border rounded-lg shadow-sm">
             <h3 className="font-medium text-muted-foreground text-sm uppercase">Total Revenue</h3>
             <div className="text-2xl font-bold mt-2">₹{totalRevenue._sum.amount?.toFixed(2) || "0.00"}</div>
          </div>
          <div className="p-6 border rounded-lg shadow-sm">
             <h3 className="font-medium text-muted-foreground text-sm uppercase">Sales</h3>
             <div className="text-2xl font-bold mt-2">+{salesCount}</div>
          </div>
          <div className="p-6 border rounded-lg shadow-sm">
             <h3 className="font-medium text-muted-foreground text-sm uppercase">Active Products</h3>
             <div className="text-2xl font-bold mt-2">{stockCount}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
