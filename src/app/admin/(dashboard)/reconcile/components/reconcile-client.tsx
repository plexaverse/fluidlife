"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { apiErrorMessage } from "@/lib/utils";

type ReconcileResult = {
  window: { from: number; to: number };
  summary: {
    razorpayCaptured: number;
    matched: number;
    localUnpaid: number;
    razorpayMissing: number;
  };
  localUnpaid: { paymentId: string; orderId?: string; amount: number; notesOrderId?: string }[];
  razorpayMissing: { orderId: string; paymentId: string }[];
};

function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const ReconcileClient: React.FC = () => {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const [from, setFrom] = useState(toDatetimeLocal(yesterday));
  const [to, setTo] = useState(toDatetimeLocal(now));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReconcileResult | null>(null);

  const run = async () => {
    try {
      setLoading(true);
      const fromS = Math.floor(new Date(from).getTime() / 1000);
      const toS = Math.floor(new Date(to).getTime() / 1000);
      const res = await axios.get<ReconcileResult>(`/api/admin/reconcile?from=${fromS}&to=${toS}`);
      setResult(res.data);
      const { localUnpaid, razorpayMissing } = res.data;
      if (localUnpaid.length === 0 && razorpayMissing.length === 0) {
        toast.success("Clean — every captured payment is reflected locally");
      } else {
        toast.error(`${localUnpaid.length} unpaid locally, ${razorpayMissing.length} missing in Razorpay`);
      }
    } catch (error) {
      toast.error(apiErrorMessage(error, "Reconciliation failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="from">From</Label>
          <Input id="from" type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="to">To</Label>
          <Input id="to" type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button onClick={run} disabled={loading}>
          {loading ? "Running…" : "Run reconciliation"}
        </Button>
      </div>

      {result && (
        <div className="space-y-6 mt-6">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Window {format(result.window.from * 1000, "PPpp")} → {format(result.window.to * 1000, "PPpp")}</Badge>
            <Badge variant="secondary">{result.summary.razorpayCaptured} captured payments</Badge>
            <Badge variant="default">{result.summary.matched} matched</Badge>
            <Badge variant={result.summary.localUnpaid > 0 ? "destructive" : "outline"}>
              {result.summary.localUnpaid} captured-but-locally-unpaid
            </Badge>
            <Badge variant="outline">{result.summary.razorpayMissing} locally-paid-but-missing-in-window</Badge>
          </div>

          <section>
            <h3 className="font-semibold mb-2 text-destructive">
              Captured by Razorpay but not paid locally ({result.localUnpaid.length})
            </h3>
            <p className="text-xs text-muted-foreground mb-2">
              These are the actionable rows. The webhook likely missed; you may need to manually mark these orders as paid.
            </p>
            <table className="w-full text-sm border">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-2">Razorpay payment id</th>
                  <th className="text-left p-2">Notes orderId</th>
                  <th className="text-right p-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {result.localUnpaid.length === 0 && (
                  <tr><td className="p-3 text-center text-muted-foreground" colSpan={3}>None — all captured payments matched.</td></tr>
                )}
                {result.localUnpaid.map((u) => (
                  <tr key={u.paymentId} className="border-t">
                    <td className="p-2 font-mono text-xs">{u.paymentId}</td>
                    <td className="p-2 font-mono text-xs">{u.notesOrderId ?? "—"}</td>
                    <td className="p-2 text-right tabular-nums">₹{u.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h3 className="font-semibold mb-2">
              Locally paid but not in Razorpay window ({result.razorpayMissing.length})
            </h3>
            <p className="text-xs text-muted-foreground mb-2">
              Usually benign (cross-window paid orders). Investigate only if you see many.
            </p>
            <table className="w-full text-sm border">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-2">Order #</th>
                  <th className="text-left p-2">Razorpay payment id</th>
                </tr>
              </thead>
              <tbody>
                {result.razorpayMissing.length === 0 && (
                  <tr><td className="p-3 text-center text-muted-foreground" colSpan={2}>None.</td></tr>
                )}
                {result.razorpayMissing.map((m) => (
                  <tr key={m.paymentId} className="border-t">
                    <td className="p-2 font-mono text-xs">{m.orderId}</td>
                    <td className="p-2 font-mono text-xs">{m.paymentId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}
    </>
  );
};
