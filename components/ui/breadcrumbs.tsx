import { ChevronRight } from "lucide-react";
import Link from "@/components/ui/link";
import { cx } from "@/lib/cx";
import { getT } from "@/lib/market";
import type { Tone } from "./button";

export type Crumb = { label: string; href?: string };

/** The dark tone is for text over an image. */
export async function Breadcrumbs({ items, tone = "light" }: { items: Crumb[]; tone?: Tone }) {
  const { m } = await getT();
  const dark = tone === "dark";
  return (
    <nav aria-label={m.site.breadcrumb}>
      <ol className={cx("flex flex-wrap items-center gap-1.5 text-sm", dark ? "text-white/75" : "text-stone-500")}>
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight aria-hidden className={cx("size-3.5", dark ? "text-white/50" : "text-stone-400")} />}
            {item.href ? (
              <Link href={item.href} className={cx("transition-colors", dark ? "hover:text-white" : "hover:text-ink")}>
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className={dark ? "text-white" : "text-ink"}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
