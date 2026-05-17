"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

const transition = {
  type: "spring" as const,
  mass: 0.5,
  damping: 11.5,
  stiffness: 100,
  restDelta: 0.001,
  restSpeed: 0.001,
};

interface MenuItemProps {
  setActive: (item: string) => void;
  active: string | null;
  item: string;
  children?: React.ReactNode;
}

/** A single top-level menu item with a hover-revealed dropdown. */
export const MenuItem = ({ setActive, active, item, children }: MenuItemProps) => (
  <div onMouseEnter={() => setActive(item)} className="relative" style={{ userSelect: "none" }}>
    <motion.p transition={{ duration: 0.3 }} className="cursor-pointer text-foreground hover:opacity-80">
      {item}
    </motion.p>
    {active !== null && (
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={transition}
      >
        {active === item && (
          <div className="absolute top-[calc(100%+1.2rem)] left-1/2 -translate-x-1/2 pt-4 z-50">
            <motion.div
              transition={transition}
              layoutId="active"
              className="transform translate-x-8 md:translate-x-0 bg-background backdrop-blur-sm rounded-2xl overflow-hidden border shadow-xl"
            >
              <motion.div layout className="w-max h-full p-4">
                {children}
              </motion.div>
            </motion.div>
          </div>
        )}
      </motion.div>
    )}
  </div>
);

interface MenuProps {
  setActive: (item: string | null) => void;
  children: React.ReactNode;
}

/** Wraps a group of MenuItems and resets the active state when the cursor leaves. */
export const Menu = ({ setActive, children }: MenuProps) => (
  <nav
    onMouseLeave={() => setActive(null)}
    className="relative flex justify-center space-x-4 px-2 py-3"
  >
    {children}
  </nav>
);

interface ProductItemProps {
  title: string;
  description: string;
  href: string;
  src: string;
  onClick?: () => void;
}

/** A category / product preview tile used inside a menu dropdown. */
export const ProductItem = ({ title, description, href, src, onClick }: ProductItemProps) => (
  <Link
    href={href}
    className="flex flex-col md:flex-row space-x-0 md:space-x-2 gap-2"
    onClick={onClick}
  >
    <Image
      src={src}
      width={110}
      height={70}
      alt={title}
      className="shrink-0 rounded-md shadow-2xl object-cover"
    />
    <div>
      <h4 className="w-40 text-lg md:text-xl font-bold mb-1 mt-2">{title}</h4>
      <p className="text-muted-foreground text-sm max-w-[10rem]">{description}</p>
    </div>
  </Link>
);

interface HoveredLinkProps extends React.ComponentProps<typeof Link> {
  onClick?: () => void;
}

/** A simple text link with hover styling — used inside the "More" dropdown. */
export const HoveredLink = ({ children, onClick, ...rest }: HoveredLinkProps) => (
  <Link {...rest} className="text-muted-foreground hover:text-foreground" onClick={onClick}>
    {children}
  </Link>
);
