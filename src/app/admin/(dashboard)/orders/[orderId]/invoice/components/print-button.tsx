"use client";

import { Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PrintButtonProps {
  orderId: string;
}

export const PrintButton: React.FC<PrintButtonProps> = ({ orderId }) => (
  <div className="flex items-center gap-2 no-print">
    <Button asChild variant="outline" size="sm">
      <a href={`/api/orders/${orderId}/invoice/pdf`} download>
        <Download className="h-4 w-4 mr-2" /> Download PDF
      </a>
    </Button>
    <Button onClick={() => window.print()} size="sm">
      <Printer className="h-4 w-4 mr-2" /> Print
    </Button>
  </div>
);
