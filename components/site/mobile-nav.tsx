"use client";

import { Menu, X } from "lucide-react";
import Link from "@/components/ui/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { useT } from "@/components/market-provider";
import { cx } from "@/lib/cx";
import type { EditAttributes } from "@spindlecommerce/storefront-client";

export type NavItem = { id: string; label: string; href: string | null; newTab: boolean; highlight: boolean; itemAttributes: EditAttributes; labelAttributes: EditAttributes };

export function MobileNav({ items }: { items: NavItem[] }) {
  const { m } = useT();
  const pathname = usePathname();
  // Open for the page it was opened on: navigating anywhere (links, back button) closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (value: boolean) => setOpenOn(value ? pathname : null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpenOn(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!items.length) return null;
  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={panelId}
        className="-ml-2 inline-flex size-10 items-center justify-center rounded-full text-ink hover:bg-stone-200/60"
      >
        {open ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
        <span className="sr-only">{open ? m.site.closeMenu : m.site.openMenu}</span>
      </button>
      {open && (
        <nav id={panelId} aria-label={m.site.mainNavigation} className="absolute inset-x-0 top-full border-b border-line bg-canvas shadow-lg">
          <ul className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
            {items.map((item) => {
              const className = cx("block rounded-xl px-3 py-3 text-base font-medium", item.highlight ? "text-ember" : "text-ink", "hover:bg-stone-100");
              const label = <span {...item.labelAttributes}>{item.label}</span>;
              return (
                <li key={item.id} {...item.itemAttributes}>
                  {item.href ? (
                    <Link href={item.href} className={className} onClick={() => setOpenOn(null)} {...(item.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                      {label}
                    </Link>
                  ) : (
                    <span className={className}>{label}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}
