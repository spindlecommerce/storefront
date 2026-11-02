import { ArrowRight } from "lucide-react";
import Link from "@/components/ui/link";
import { cx } from "@/lib/cx";
import { getT } from "@/lib/market";
import { categoryPath } from "@/lib/paths";
import type { CategoryLink } from "@/lib/types";

export async function SubcategoryLinks({ categories, variant = "pills", className }: { categories: CategoryLink[]; variant?: "pills" | "cards"; className?: string }) {
  const { m } = await getT();
  if (variant === "cards") {
    return (
      <ul className={cx("grid grid-cols-2 gap-4 sm:gap-6", categories.length === 3 && "lg:grid-cols-3", categories.length >= 4 && "lg:grid-cols-4", className)} aria-label={m.category.subcategories}>
        {categories.map((child) => (
          <li key={child.id}>
            <Link
              href={categoryPath(child.path)}
              className="group flex h-full min-h-32 flex-col justify-between gap-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-line transition hover:-translate-y-0.5 hover:shadow-md sm:min-h-40 sm:p-6"
            >
              <span className="text-balance text-lg font-semibold tracking-tight sm:text-xl">{child.name}</span>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand group-hover:text-brand-strong">
                {m.category.shopNow}
                <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className={cx("flex flex-wrap gap-2", className)} aria-label={m.category.subcategories}>
      {categories.map((child) => (
        <li key={child.id}>
          <Link href={categoryPath(child.path)} className="inline-flex h-10 items-center rounded-full border border-stone-300 bg-white px-4 text-sm font-medium transition-colors hover:border-ink">
            {child.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
