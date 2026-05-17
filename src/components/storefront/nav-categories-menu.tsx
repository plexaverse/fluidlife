"use client";

import { HoveredLink, Menu, MenuItem, ProductItem } from "@/components/ui/navbar-menu";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  image: string | null;
  productCount?: number;
}

interface NavCategoriesMenuProps {
  categories: Category[];
  className?: string;
}

/**
 * Hover-revealed category navigation strip underneath the main navbar.
 * Ported from takekare's NavCategoriesMenu, but pulls categories dynamically
 * instead of hardcoding billboard IDs.
 *
 * If there are no categories, the menu still shows the "More" entry so
 * About/Contact stay one click away.
 */
export function NavCategoriesMenu({ categories, className }: NavCategoriesMenuProps) {
  // We don't need active state here because <Menu> is a context-less wrapper.
  // The individual MenuItem siblings each track their own hover; we just
  // share a single onMouseLeave on Menu to reset.
  return (
    <NavInner categories={categories} className={className} />
  );
}

// ── Inner component with state ────────────────────────────────────────────

import { useState } from "react";

function NavInner({ categories, className }: NavCategoriesMenuProps) {
  const [active, setActive] = useState<string | null>(null);
  const close = () => setActive(null);

  // Group categories by name heuristic — anything containing "Personal"
  // surfaces under a "Personal Kare" dropdown, anything else under
  // "Surface Kare". Edge-case-friendly: an empty cluster is hidden.
  const personal = categories.filter((c) => /personal/i.test(c.name));
  const surface = categories.filter((c) => !/personal/i.test(c.name));

  return (
    <div className={cn("w-full flex justify-center", className)}>
      <Menu setActive={setActive}>
        {personal.length > 0 && (
          <MenuItem setActive={setActive} active={active} item="Personal Kare">
            <div className="text-sm grid gap-6 p-2 min-w-[260px]">
              {personal.map((c) => (
                <ProductItem
                  key={c.id}
                  title={c.name}
                  href={`/category/${c.id}`}
                  src={c.image ?? "/img/placeholder.png"}
                  description={`Explore our ${c.name.toLowerCase()} range.`}
                  onClick={close}
                />
              ))}
            </div>
          </MenuItem>
        )}

        {surface.length > 0 && (
          <MenuItem setActive={setActive} active={active} item="Surface Kare">
            <div className="text-sm grid md:grid-cols-2 gap-6 p-2 min-w-[300px]">
              {surface.map((c) => (
                <ProductItem
                  key={c.id}
                  title={c.name}
                  href={`/category/${c.id}`}
                  src={c.image ?? "/img/placeholder.png"}
                  description={`Browse ${c.name.toLowerCase()} essentials.`}
                  onClick={close}
                />
              ))}
            </div>
          </MenuItem>
        )}

        <MenuItem setActive={setActive} active={active} item="More">
          <div className="flex flex-col space-y-4 text-sm mr-4 min-w-[140px]">
            <HoveredLink href="/about-us" onClick={close}>
              About Us
            </HoveredLink>
            <HoveredLink href="/explore" onClick={close}>
              Explore
            </HoveredLink>
            <HoveredLink href="/contact" onClick={close}>
              Contact
            </HoveredLink>
          </div>
        </MenuItem>
      </Menu>
    </div>
  );
}
