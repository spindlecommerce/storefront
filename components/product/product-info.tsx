import { RichHtml } from "@/components/ui/rich-html";
import { cx } from "@/lib/cx";
import { sanitize } from "@/lib/sanitize";
import type { Product } from "@/lib/types";

/** Sanitized HTML, or null. */
export const productDescription = (product: Pick<Product, "description">) => (product.description?.trim() ? sanitize(product.description) : null);

export const productSpecs = (product: Pick<Product, "attributes">) => product.attributes.filter((a) => a.value);

/** `html` must come from productDescription, which sanitizes it. */
export function DescriptionHtml({ html, className }: { html: string; className?: string }) {
  return <RichHtml className={cx("rich-text text-stone-700", className)} html={html} />;
}

export function SpecList({ specs, className }: { specs: Product["attributes"]; className?: string }) {
  return (
    <dl className={cx("divide-y divide-line border-y border-line text-sm", className)}>
      {specs.map((spec) => (
        <div key={spec.attribute.code} className="flex justify-between gap-6 py-3">
          <dt className="text-stone-500">{spec.attribute.label}</dt>
          <dd className="text-right font-medium text-ink">{spec.value}</dd>
        </div>
      ))}
    </dl>
  );
}
