import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "@/components/ui/link";
import { ProductCardGrid, type GridColumns } from "@/components/product/product-card-grid";
import { cx } from "@/lib/cx";
import { getCategoryProducts, type ProductSort } from "@/lib/storefront";
import type { Messages } from "@/lib/i18n";
import { getT } from "@/lib/market";
import { categoryPath } from "@/lib/paths";
import type { Category, SearchParams } from "@/lib/types";

/** Featured is the API's default for a category: the order merchandised in the admin. */
const SORTS: Record<string, { label: keyof Messages["category"]["sorts"]; sort: ProductSort | null }> = {
  featured: { label: "featured", sort: null },
  newest: { label: "newest", sort: { field: "NEWEST", direction: "DESC" } },
  "price-asc": { label: "priceAsc", sort: { field: "PRICE", direction: "ASC" } },
  "price-desc": { label: "priceDesc", sort: { field: "PRICE", direction: "DESC" } },
  name: { label: "name", sort: { field: "NAME", direction: "ASC" } },
};

/** Opaque API cursors are base64url; anything else in the URL is ignored. */
const CURSOR = /^[A-Za-z0-9_-]{1,200}$/;
const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/**
 * The API pages forward only, so the URL carries the earlier pages' cursors to link back:
 * ?after=<cursor>&trail=<cursor>.<cursor>.
 */
const pageState = (params: SearchParams, sortable: boolean) => {
  const sortKey = (sortable && one(params.sort)) || "featured";
  const after = one(params.after);
  const trail = (one(params.trail) ?? "").split(".").filter((c) => CURSOR.test(c));
  return { sortKey: sortKey in SORTS ? sortKey : "featured", after: after && CURSOR.test(after) ? after : null, trail };
};

const query = (values: { sort?: string; after?: string | null; trail?: string[] }) => {
  const params = new URLSearchParams();
  if (values.sort && values.sort !== "featured") params.set("sort", values.sort);
  if (values.after) params.set("after", values.after);
  if (values.trail?.length) params.set("trail", values.trail.join("."));
  const search = params.toString();
  return search ? `?${search}` : "";
};

type Props = {
  category: Pick<Category, "id" | "path">;
  /** The page's query string: ?sort, ?after and ?trail. */
  searchParams: SearchParams;
  pageSize?: number;
  columns?: GridColumns;
  /** Without it, the listing is in the featured order. */
  showSort?: boolean;
  showPrices?: boolean;
  className?: string;
};

/** A category's products, its subcategories' included. */
export async function CategoryListing({ category, searchParams, pageSize = 12, columns = "4", showSort = true, showPrices = true, className }: Props) {
  const t = await getT();
  const { m } = t;
  const { sortKey, after, trail } = pageState(searchParams, showSort);
  const { products, totalCount, endCursor } = await getCategoryProducts(category.id, pageSize, after, SORTS[sortKey]?.sort ?? null);
  const base = categoryPath(category.path);
  const page = after ? trail.length + 2 : 1;
  const pages = Math.max(1, Math.ceil(totalCount / pageSize));
  const previous = after ? `${base}${query({ sort: sortKey, after: trail.at(-1) ?? null, trail: trail.slice(0, -1) })}` : null;
  const next = endCursor ? `${base}${query({ sort: sortKey, after: endCursor, trail: after ? [...trail, after] : [] })}` : null;

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <p className="text-sm text-stone-500">{t.p(m.category.products, totalCount)}</p>
        {showSort && (
          <nav aria-label={m.category.sortProducts} className="flex flex-wrap gap-1 text-sm">
            {Object.entries(SORTS).map(([key, option]) => (
              <Link
                key={key}
                href={`${base}${query({ sort: key })}`}
                aria-current={key === sortKey ? "true" : undefined}
                className={cx("rounded-full px-3 py-1.5 font-medium transition-colors", key === sortKey ? "bg-ink text-white" : "text-stone-600 hover:bg-stone-200/60 hover:text-ink")}
                scroll={false}
              >
                {m.category.sorts[option.label]}
              </Link>
            ))}
          </nav>
        )}
      </div>

      {products.length > 0 ? (
        // The listing is a category page's main content: its first cards load eagerly.
        <ProductCardGrid products={products} columns={columns} showPrices={showPrices} eager={4} className="mt-8" />
      ) : (
        <p className="py-20 text-center text-stone-500">{m.category.empty}</p>
      )}

      {pages > 1 && (
        <nav aria-label={m.category.pagination} className="mt-14 flex items-center justify-between gap-4 border-t border-line pt-6">
          {previous ? (
            <Link href={previous} className="inline-flex items-center gap-1.5 text-sm font-semibold hover:text-brand" rel="prev">
              <ChevronLeft aria-hidden className="size-4" /> {m.category.previous}
            </Link>
          ) : (
            <span />
          )}
          <p className="text-sm text-stone-500">{t.f(m.category.pageOf, { page, pages })}</p>
          {next ? (
            <Link href={next} className="inline-flex items-center gap-1.5 text-sm font-semibold hover:text-brand" rel="next">
              {m.category.next} <ChevronRight aria-hidden className="size-4" />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
