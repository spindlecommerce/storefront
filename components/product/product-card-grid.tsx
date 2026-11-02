import { cx } from "@/lib/cx";
import type { ProductSummary } from "@/lib/types";
import type { EditAttributes } from "@spindlecommerce/storefront-client";
import { ProductCard } from "./product-card";

const COLUMNS = { "2": "sm:grid-cols-2", "3": "sm:grid-cols-2 lg:grid-cols-3", "4": "sm:grid-cols-3 lg:grid-cols-4" } as const;
const SIZES = { "2": "(min-width: 640px) 50vw, 50vw", "3": "(min-width: 1024px) 33vw, 50vw", "4": "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" } as const;

export type GridColumns = keyof typeof COLUMNS;

type Props = {
  products: ProductSummary[];
  /** Columns on wide screens; phones show two. */
  columns?: GridColumns;
  showPrices?: boolean;
  /** How many of the first cards load their photo eagerly. */
  eager?: number;
  className?: string;
  attributes?: EditAttributes;
};

export function ProductCardGrid({ products, columns = "4", showPrices = true, eager = 0, className, attributes }: Props) {
  return (
    <ul className={cx("grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6", COLUMNS[columns], className)} {...attributes}>
      {products.map((product, i) => (
        <li key={product.id}>
          <ProductCard product={product} showPrice={showPrices} sizes={SIZES[columns]} eager={i < eager} />
        </li>
      ))}
    </ul>
  );
}
