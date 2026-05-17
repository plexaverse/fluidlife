"use client";

import { motion } from "framer-motion";
import { Droplet, Earth, FlaskConical, Heart, Leaf, ThumbsUp } from "lucide-react";

const FEATURES = [
  { Icon: Leaf, label: "Plant Based" },
  { Icon: Earth, label: "Biodegradable" },
  { Icon: FlaskConical, label: "Free from Toxic Chemicals" },
  { Icon: Heart, label: "Not Tested on Animals" },
  { Icon: ThumbsUp, label: "IFRA certified Allergen Free" },
  { Icon: Droplet, label: "Scientifically Effective" },
] as const;

function StrengthCard({
  Icon,
  label,
  index,
}: {
  Icon: (typeof FEATURES)[number]["Icon"];
  label: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.3, duration: 0.8 + index * 0.1, ease: "easeInOut" }}
    >
      <div className="w-full py-10 md:py-20 flex flex-col items-center border rounded-lg md:rounded-3xl shadow-sm hover:shadow-lg transition my-4 bg-card">
        <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-r from-[rgb(18,194,233)] via-[rgb(246,79,89)] to-[rgb(196,113,237)] rounded-full opacity-10" />
          <div className="relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
            <Icon className="text-purple-500" size={24} />
          </div>
        </div>
        <div className="flex-grow w-auto md:w-100 px-2 md:px-auto">
          <p className="text-center text-sm text-muted-foreground px-2 h-10">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * "Our Strengths" — six-icon grid block. Visual port of the takekare section.
 */
export function OurStrengths() {
  return (
    <section className="mb-8 mx-4">
      <p className="gradient-text-semibold text-3xl text-center py-2 mt-16">Our Strengths</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2 max-w-6xl mx-auto">
        {FEATURES.map((f, i) => (
          <StrengthCard key={f.label} Icon={f.Icon} label={f.label} index={i} />
        ))}
      </div>
    </section>
  );
}
