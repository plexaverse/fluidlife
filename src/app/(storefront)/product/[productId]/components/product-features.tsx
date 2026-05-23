import { CheckCircle2 } from "lucide-react";

import { Timeline } from "@/components/ui/timeline";

interface ProductFeaturesProps {
  reasonsToBuy: string[];
  usage: string[];
  idealFor: string[];
  greenDiscounts: string[];
  sustainability: string[];
}

/**
 * Five-stage scroll timeline (Reasons to Buy / How to Use / Ideal For /
 * Green Discounts / Sustainability). Each stage has its own pastel hover
 * tint; empty arrays cause the stage to be omitted entirely so the layout
 * isn't padded with empty sections.
 */
export function ProductFeatures({
  reasonsToBuy,
  usage,
  idealFor,
  greenDiscounts,
  sustainability,
}: ProductFeaturesProps) {
  const data = [
    {
      title: "Reasons to Buy",
      type: "benefits" as const,
      items: reasonsToBuy,
    },
    { title: "How to Use", type: "usage" as const, items: usage },
    { title: "Ideal For", type: "idealFor" as const, items: idealFor },
    {
      title: "Green Discounts",
      type: "greenDiscounts" as const,
      items: greenDiscounts,
    },
    {
      title: "Sustainability",
      type: "sustainability" as const,
      items: sustainability,
    },
  ]
    .filter((stage) => stage.items.length > 0)
    .map((stage) => ({
      title: stage.title,
      type: stage.type,
      content: (
        <div>
          <div className="mb-8">
            {stage.items.map((item, index) => (
              <div
                key={index}
                className="flex gap-4 items-center text-neutral-700 dark:text-neutral-300 text-sm md:text-lg mb-2"
              >
                <div className="flex">
                  <div className="w-1 h-1 md:4 md:4 mr-7 md:mr-8">
                    <CheckCircle2 color="green" />
                  </div>
                  <div className="min-h-10">{item}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    }));

  if (data.length === 0) return null;
  return (
    <div className="w-full mt-10 md:mt-30">
      <Timeline data={data} />
    </div>
  );
}
