"use client";

import { useT } from "@/components/market-provider";
import { cx } from "@/lib/cx";
import { isLower } from "@spindlecommerce/storefront-client";
import type { Money, PriceRange } from "@/lib/types";

export function Price({ price, compareAt, from, className }: { price: Money | null | undefined; compareAt?: Money | null; from?: boolean; className?: string }) {
  const { f, m } = useT();
  if (!price) return null;
  const onSale = isLower(price, compareAt);
  return (
    <p className={cx("flex flex-wrap items-baseline gap-x-2", className)}>
      {onSale && <span className="sr-only">{m.product.salePrice}</span>}
      <span className={cx("font-semibold", onSale ? "text-ember" : "text-ink")}>{from ? f(m.product.from, { price: price.formatted }) : price.formatted}</span>
      {onSale && (
        <>
          <span className="sr-only">{m.product.regularPrice}</span>
          <s className="text-stone-400">{compareAt.formatted}</s>
        </>
      )}
    </p>
  );
}

/** The cheapest variant's price, with "From" when variants differ. */
export function PriceRangeLabel({ range, className }: { range: PriceRange | null | undefined; className?: string }) {
  const min = range?.minVariantPrice;
  if (!min) return null;
  const from = !!range.maxVariantPrice && range.maxVariantPrice.amount !== min.amount;
  return <Price price={min} compareAt={range.compareAtMinVariantPrice} from={from} className={className} />;
}
