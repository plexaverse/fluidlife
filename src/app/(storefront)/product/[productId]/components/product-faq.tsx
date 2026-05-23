"use client";

import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";

interface FaqItem {
  q: string;
  a: string;
}

interface ProductFaqProps {
  /** Either pre-parsed {q,a}[] entries (admin-saved Json) or takekare-style
   *  "Q: ... A: ..." strings — both shapes are normalised here. */
  items: (FaqItem | string)[];
  className?: string;
}

/**
 * Takekare-style FAQ accordion: single-open, slide-down content, gray pill
 * triggers with a rotating chevron. Keeps the same surface as the data we
 * already store (Product.faq is Json).
 */
export function ProductFaq({ items, className = "" }: ProductFaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const parsed = useMemo<FaqItem[]>(() => {
    return items
      .map((item) => {
        if (typeof item === "string") {
          const parts = item.split("A:");
          return {
            q: parts[0].replace("Q:", "").trim(),
            a: parts[1]?.trim() ?? "",
          };
        }
        return item;
      })
      .filter((x) => x.q.trim().length > 0);
  }, [items]);

  if (parsed.length === 0) return null;

  return (
    <div
      className={`w-full max-w-[500px] self-start bg-white rounded-lg shadow-md overflow-hidden ${className}`}
    >
      {parsed.map((item, index) => (
        <div
          key={index}
          className={index !== parsed.length - 1 ? "border-b border-gray-200" : ""}
        >
          <button
            type="button"
            className="w-full p-5 text-base font-medium flex justify-between items-center cursor-pointer bg-gray-100 hover:bg-gray-200 transition-colors duration-300"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            aria-expanded={openIndex === index}
          >
            <span className="text-left">{item.q}</span>
            <ChevronRight
              className={`w-5 h-5 transition-transform duration-300 ${
                openIndex === index ? "rotate-90" : ""
              }`}
            />
          </button>
          <div
            className={`overflow-hidden bg-white text-gray-600 text-sm leading-relaxed transition-all duration-300 ${
              openIndex === index ? "max-h-48 py-4 px-5" : "max-h-0 py-0 px-5"
            }`}
          >
            {item.a}
          </div>
        </div>
      ))}
    </div>
  );
}
