import { notFound } from "next/navigation";

import { ensureInvoiceNumber, buildInvoicePayload } from "@/lib/invoice";
import { formatter } from "@/lib/utils";

import { PrintButton } from "./components/print-button";

interface PageProps {
  params: Promise<{ orderId: string }>;
}

const InvoicePrintPage = async ({ params }: PageProps) => {
  const { orderId } = await params;
  await ensureInvoiceNumber(orderId).catch(() => null);
  const inv = await buildInvoicePayload(orderId);
  if (!inv) notFound();

  const seller = inv.seller;
  const buyer = inv.buyer;

  return (
    <div className="bg-white text-black">
      {/* Print CSS — hides nav + buttons, sets A4 page */}
      <style>{`
        @media print {
          @page { size: A4; margin: 16mm; }
          body { background: white; }
          .no-print { display: none !important; }
          .print-page { box-shadow: none !important; padding: 0 !important; max-width: none !important; }
          a { color: inherit; text-decoration: none; }
        }
      `}</style>

      <div className="no-print sticky top-0 z-10 bg-muted/50 border-b px-6 py-3 flex items-center justify-between">
        <p className="text-sm">
          Invoice <span className="font-mono">{inv.invoice.number ?? "(unissued)"}</span>{" "}
          for order <span className="font-mono">{inv.invoice.orderId}</span>
        </p>
        <PrintButton orderId={orderId} />
      </div>

      <div className="print-page max-w-4xl mx-auto p-12 space-y-8 shadow-sm">
        <header className="flex items-start justify-between border-b pb-6">
          <div>
            <h1 className="text-3xl font-bold">{seller.name ?? "Tax Invoice"}</h1>
            {seller.address && <p className="text-sm whitespace-pre-line">{seller.address}</p>}
            {seller.state && seller.pincode && (
              <p className="text-sm">
                {seller.state} — {seller.pincode}
              </p>
            )}
            {seller.phone && <p className="text-sm">{seller.phone}</p>}
            {seller.email && <p className="text-sm">{seller.email}</p>}
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold tracking-tight">TAX INVOICE</p>
            <p className="text-sm mt-2">
              <span className="text-gray-500">No.</span>{" "}
              <span className="font-mono">{inv.invoice.number ?? "—"}</span>
            </p>
            <p className="text-sm">
              <span className="text-gray-500">Date:</span>{" "}
              {new Date(inv.invoice.issuedAt).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
            <p className="text-sm">
              <span className="text-gray-500">Order:</span>{" "}
              <span className="font-mono">{inv.invoice.orderId}</span>
            </p>
            {seller.gstin && (
              <p className="text-sm mt-2">
                <span className="text-gray-500">GSTIN:</span> {seller.gstin}
              </p>
            )}
            {seller.pan && (
              <p className="text-sm">
                <span className="text-gray-500">PAN:</span> {seller.pan}
              </p>
            )}
          </div>
        </header>

        <section className="grid grid-cols-2 gap-8 text-sm">
          <div>
            <h2 className="font-semibold uppercase text-xs text-gray-500 mb-2">Bill to</h2>
            <p className="font-medium">{buyer.companyName || buyer.name}</p>
            {buyer.companyName && buyer.companyName !== buyer.name && <p>{buyer.name}</p>}
            <p>{buyer.phone}</p>
            <p>{buyer.email}</p>
            {buyer.gstNumber && <p className="mt-1">GSTIN: {buyer.gstNumber}</p>}
          </div>
          <div>
            <h2 className="font-semibold uppercase text-xs text-gray-500 mb-2">Ship to</h2>
            <p>{buyer.address.address1}</p>
            {buyer.address.address2 && <p>{buyer.address.address2}</p>}
            {buyer.address.landmark && <p>Near {buyer.address.landmark}</p>}
            <p>
              {buyer.address.city}, {buyer.address.state} — {buyer.address.pincode}
            </p>
            <p>{buyer.address.country}</p>
          </div>
        </section>

        <section>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="text-left py-2">Description</th>
                <th className="text-left py-2">HSN</th>
                <th className="text-right py-2">Qty</th>
                <th className="text-right py-2">Rate</th>
                <th className="text-right py-2">GST%</th>
                <th className="text-right py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {inv.items.map((it, idx) => (
                <tr key={idx} className="border-b">
                  <td className="py-2">{it.name}</td>
                  <td className="py-2">{it.hsnCode || "—"}</td>
                  <td className="py-2 text-right tabular-nums">{it.quantity}</td>
                  <td className="py-2 text-right tabular-nums">
                    {formatter.format(Number(it.unitPrice))}
                  </td>
                  <td className="py-2 text-right tabular-nums">{it.gstRate}%</td>
                  <td className="py-2 text-right tabular-nums">
                    {formatter.format(Number(it.lineTotal))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="flex justify-end">
          <table className="text-sm">
            <tbody>
              <tr>
                <td className="text-gray-500 pr-8">Subtotal (incl. GST)</td>
                <td className="text-right tabular-nums">
                  {formatter.format(Number(inv.totals.subtotal))}
                </td>
              </tr>
              {Number(inv.totals.discount) > 0 && (
                <tr>
                  <td className="text-gray-500 pr-8">
                    Discount{inv.totals.coupon ? ` (${inv.totals.coupon})` : ""}
                  </td>
                  <td className="text-right tabular-nums">
                    −{formatter.format(Number(inv.totals.discount))}
                  </td>
                </tr>
              )}
              {Number(inv.totals.delivery) > 0 && (
                <tr>
                  <td className="text-gray-500 pr-8">Delivery</td>
                  <td className="text-right tabular-nums">
                    {formatter.format(Number(inv.totals.delivery))}
                  </td>
                </tr>
              )}
              <tr>
                <td className="text-gray-500 pr-8">GST extracted</td>
                <td className="text-right tabular-nums">
                  {formatter.format(Number(inv.totals.tax))}
                </td>
              </tr>
              <tr className="border-t-2 border-black font-semibold text-base">
                <td className="pr-8 pt-2">Grand total</td>
                <td className="text-right tabular-nums pt-2">
                  {formatter.format(Number(inv.totals.grandTotal))}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {inv.taxBreakup && (inv.taxBreakup as any).lines && (
          <section>
            <h2 className="font-semibold uppercase text-xs text-gray-500 mb-2">
              Tax breakup —{" "}
              {(inv.taxBreakup as any).interState ? "Inter-state (IGST)" : "Intra-state (CGST + SGST)"}
            </h2>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1">HSN</th>
                  <th className="text-right py-1">Rate</th>
                  <th className="text-right py-1">Taxable</th>
                  <th className="text-right py-1">CGST</th>
                  <th className="text-right py-1">SGST</th>
                  <th className="text-right py-1">IGST</th>
                </tr>
              </thead>
              <tbody>
                {(inv.taxBreakup as any).lines.map((l: any, idx: number) => (
                  <tr key={idx} className="border-b">
                    <td className="py-1">{l.hsnCode || "—"}</td>
                    <td className="py-1 text-right tabular-nums">{l.rate}%</td>
                    <td className="py-1 text-right tabular-nums">₹{l.taxable}</td>
                    <td className="py-1 text-right tabular-nums">₹{l.cgst}</td>
                    <td className="py-1 text-right tabular-nums">₹{l.sgst}</td>
                    <td className="py-1 text-right tabular-nums">₹{l.igst}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t font-medium">
                  <td className="py-1" colSpan={2}>Totals</td>
                  <td className="py-1 text-right tabular-nums">
                    ₹{(inv.taxBreakup as any).totals?.taxable}
                  </td>
                  <td className="py-1 text-right tabular-nums">
                    ₹{(inv.taxBreakup as any).totals?.cgst}
                  </td>
                  <td className="py-1 text-right tabular-nums">
                    ₹{(inv.taxBreakup as any).totals?.sgst}
                  </td>
                  <td className="py-1 text-right tabular-nums">
                    ₹{(inv.taxBreakup as any).totals?.igst}
                  </td>
                </tr>
              </tfoot>
            </table>
          </section>
        )}

        <footer className="text-xs text-gray-500 pt-8 border-t">
          <p>This is a computer-generated invoice and does not require a signature.</p>
          <p>Payment type: {inv.invoice.paymentType}</p>
        </footer>
      </div>
    </div>
  );
};

export default InvoicePrintPage;
