import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";

import { ReconcileClient } from "./components/reconcile-client";

const ReconcilePage = () => (
  <div className="flex-col">
    <div className="flex-1 space-y-4 p-8 pt-6">
      <Heading
        title="Payment reconciliation"
        description="Compare Razorpay captured payments against local order state for the chosen window."
      />
      <Separator />
      <ReconcileClient />
    </div>
  </div>
);

export default ReconcilePage;
