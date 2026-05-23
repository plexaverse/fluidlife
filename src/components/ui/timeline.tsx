"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface TimelineEntry {
  title: string;
  content: React.ReactNode;
  type?: "benefits" | "usage" | "idealFor" | "greenDiscounts" | "sustainability";
}

/**
 * Aceternity scroll-bound timeline. Each entry renders as a "sticky" left
 * column (dot + title) next to scrollable content. As you scroll past a
 * section it lights up with a pastel radial wash + matching dot colour, and
 * a thin gradient bar grows down the centre rail.
 *
 * Ported from takekare with light tidy-ups (no behaviour change).
 */
export function Timeline({ data }: { data: TimelineEntry[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [height, setHeight] = useState(0);
  const [activeSection, setActiveSection] = useState<number | null>(null);

  useEffect(() => {
    if (ref.current) {
      setHeight(ref.current.getBoundingClientRect().height);
    }
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  useEffect(() => {
    const handleScroll = () => {
      const viewportHeight = window.innerHeight;
      let closestSection: number | null = null;
      let closestDistance = Infinity;

      sectionRefs.current.forEach((sectionRef, index) => {
        if (sectionRef) {
          const rect = sectionRef.getBoundingClientRect();
          const sectionCenter = rect.top + rect.height / 2;
          const viewportCenter = viewportHeight / 2;
          const distance = Math.abs(sectionCenter - viewportCenter);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestSection = index;
          }
        }
      });

      setActiveSection(closestSection);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getSectionStyle = (index: number, type?: string): React.CSSProperties => {
    if (activeSection !== index) return {};
    const tints: Record<string, string> = {
      benefits: "rgba(255, 182, 193, 0.3)",
      usage: "rgba(255, 255, 224, 0.3)",
      idealFor: "rgba(173, 216, 230, 0.3)",
      greenDiscounts: "rgba(144, 238, 144, 0.3)",
      sustainability: "rgba(221, 160, 221, 0.3)",
    };
    const tint = type ? tints[type] : undefined;
    if (!tint) return {};
    return {
      background: `radial-gradient(circle at center, ${tint} 0%, ${tint.replace("0.3", "0.1")} 50%, rgba(255, 255, 255, 0) 80%)`,
      borderRadius: "16px",
    };
  };

  const getDotStyle = (index: number, type?: string): React.CSSProperties => {
    if (activeSection !== index) return {};
    const dots: Record<string, string> = {
      benefits: "rgb(255, 182, 193)",
      usage: "rgb(255, 255, 224)",
      idealFor: "rgb(173, 216, 230)",
      greenDiscounts: "rgb(144, 238, 144)",
      sustainability: "rgb(221, 160, 221)",
    };
    return { backgroundColor: type ? dots[type] : "rgb(200, 200, 200)" };
  };

  return (
    <div
      className="w-full bg-white dark:bg-neutral-950 font-sans md:px-10"
      ref={containerRef}
    >
      <div ref={ref} className="relative max-w-7xl mx-auto pb-20">
        {data.map((item, index) => {
          const isActive = activeSection === index;
          return (
            <div
              key={index}
              ref={(el) => {
                sectionRefs.current[index] = el;
              }}
              className="flex justify-start pt-10 md:pt-40 md:gap-10 transition-all duration-700 ease-in-out"
            >
              <div className="sticky flex flex-col md:flex-row z-40 items-center top-40 self-start max-w-xs lg:max-w-sm md:w-full">
                <div className="h-10 absolute left-3 md:left-3 w-10 rounded-full bg-white dark:bg-black flex items-center justify-center">
                  <div
                    className="h-4 w-4 rounded-full border border-neutral-300 dark:border-neutral-700 p-2 transition-all duration-500"
                    style={getDotStyle(index, item.type)}
                  />
                </div>
                <h3
                  className={`hidden md:block text-xl md:pl-20 md:text-5xl font-bold transition-colors duration-500 ${
                    isActive
                      ? "text-neutral-800 dark:text-neutral-200"
                      : "text-neutral-500 dark:text-neutral-500"
                  }`}
                >
                  {item.title}
                </h3>
              </div>

              <div
                className="relative pl-20 pr-4 md:pl-4 w-full py-8 transition-all duration-700 ease-in-out"
                style={getSectionStyle(index, item.type)}
              >
                <h3
                  className={`md:hidden block text-2xl mb-4 text-left font-bold transition-colors duration-500 ${
                    isActive
                      ? "text-neutral-800 dark:text-neutral-200"
                      : "text-neutral-500 dark:text-neutral-500"
                  }`}
                >
                  {item.title}
                </h3>
                {item.content}
              </div>
            </div>
          );
        })}

        <div
          style={{ height: `${height}px` }}
          className="absolute md:left-8 left-8 top-0 overflow-hidden w-[2px] bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-neutral-200 dark:via-neutral-700 to-transparent to-[99%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]"
        >
          <motion.div
            style={{ height: heightTransform, opacity: opacityTransform }}
            className="absolute inset-x-0 top-0 w-[2px] bg-gradient-to-t from-purple-500 via-blue-500 to-transparent from-[0%] via-[10%] rounded-full"
          />
        </div>
      </div>
    </div>
  );
}
