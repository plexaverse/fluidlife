"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

export const PrintButton: React.FC = () => (
  <Button onClick={() => window.print()} size="sm">
    <Printer className="h-4 w-4 mr-2" /> Print / Save as PDF
  </Button>
);
