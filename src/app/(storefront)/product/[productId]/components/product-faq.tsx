"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

interface FaqItem {
  q: string;
  a: string;
}

export function ProductFaq({ items }: { items: FaqItem[] }) {
  if (!items?.length) return null;
  return (
    <Accordion.Root type="single" collapsible className="w-full divide-y rounded-2xl border">
      {items.map((item, idx) => (
        <Accordion.Item key={idx} value={`faq-${idx}`}>
          <Accordion.Header>
            <Accordion.Trigger
              className={cn(
                "group flex w-full items-center justify-between gap-4 px-5 py-4 text-left",
                "text-sm font-medium hover:bg-muted/30 transition-colors"
              )}
            >
              <span>{item.q}</span>
              <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="overflow-hidden data-[state=open]:animate-fade-up">
            <div className="px-5 pb-4 text-sm text-muted-foreground">{item.a}</div>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
