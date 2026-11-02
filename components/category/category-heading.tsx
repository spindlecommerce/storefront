import { Breadcrumbs, type Crumb } from "@/components/ui/breadcrumbs";
import { RichHtml } from "@/components/ui/rich-html";
import type { Tone } from "@/components/ui/button";
import { cx } from "@/lib/cx";
import { getT } from "@/lib/market";
import { looksLikeHtml } from "@/lib/markdown";
import { categoryPath } from "@/lib/paths";
import { sanitize } from "@/lib/sanitize";
import type { Category } from "@/lib/types";

/** Home › the category's parents › the category. */
export const categoryCrumbs = (category: Pick<Category, "name" | "ancestors">, home: string): Crumb[] => [
  { label: home, href: "/" },
  ...category.ancestors.map((a) => ({ label: a.name, href: categoryPath(a.path) })),
  { label: category.name },
];

type Props = {
  category: Category;
  breadcrumbs?: boolean;
  description?: boolean;
  /** "dark" for text over an image. */
  tone?: Tone;
};

/** The description may be HTML or plain text. */
export async function CategoryHeading({ category, breadcrumbs = true, description = true, tone = "light" }: Props) {
  const { m } = await getT();
  const text = description ? (category.description?.trim() ?? "") : "";
  const html = text && looksLikeHtml(text) ? sanitize(text) : null;
  const dark = tone === "dark";
  return (
    <>
      {breadcrumbs && <Breadcrumbs items={categoryCrumbs(category, m.site.home)} tone={tone} />}
      <header className={cx("max-w-3xl", breadcrumbs && "mt-6 sm:mt-8")}>
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">{category.name}</h1>
        {html ? (
          <RichHtml className={cx("rich-text mt-4 text-lg", dark ? "rich-text-invert text-white/85" : "text-stone-600")} html={html} />
        ) : (
          text && <p className={cx("mt-4 text-pretty text-lg", dark ? "text-white/85" : "text-stone-600")}>{text}</p>
        )}
      </header>
    </>
  );
}
