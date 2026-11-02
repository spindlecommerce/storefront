import { unstable_rethrow } from "next/navigation";
import { Container } from "@/components/ui/container";
import { ProductCard } from "@/components/product/product-card";
import { ProductCardGrid } from "@/components/product/product-card-grid";
import { getCategoryProducts, getNewestProducts, isPreviewExpired } from "@/lib/storefront";
import type { ProductGridNode } from "@/lib/builder-components";
import { getT } from "@/lib/market";
import type { ProductSummary } from "@/lib/types";
import type { NodeProps } from "./context";
import { DraftHint } from "./draft-hint";
import { SectionHeader } from "./section-header";

/** Hand-picked products come from the page's references; the others are fetched here. */
export async function ProductGrid({ node, ctx }: NodeProps<ProductGridNode>) {
  const { title, source, products: picked, category, limit, columns, showPrices, link } = node.fields;
  const e = ctx.edit;
  const count = Math.min(Math.max(limit ?? 8, 1), 24);
  const from = source ?? "manual";

  let products: ProductSummary[] = [];
  let problem: string | null = null;
  try {
    if (from === "manual") products = picked.flatMap((id) => ctx.products.get(id) ?? []).slice(0, count);
    else if (from === "category") products = category ? (await getCategoryProducts(category, count)).products : [];
    else products = await getNewestProducts(count);
  } catch (error) {
    unstable_rethrow(error);
    if (isPreviewExpired(error)) throw error;
    // A failing grid should not take the whole page down.
    console.error(`product_grid ${node.id}: could not load products`, error);
    problem = "The products could not be loaded.";
  }
  if (!products.length && !ctx.draft) return null;
  const { m } = await getT();

  const hint =
    problem ??
    (from === "manual" ? "Pick products for this grid (unpublished products are not shown)." : from === "category" ? (category ? "This category has no products to show." : "Choose a category.") : "No products yet.");
  const listField = from === "manual" ? e.field(node.id, "products") : from === "category" ? e.field(node.id, "category") : e.field(node.id, "source");

  return (
    <section className="py-12 sm:py-16" {...e.node(node)}>
      <Container>
        <SectionHeader title={title} titleAttributes={e.text(node.id, "title")} link={link} linkAttributes={e.field(node.id, "link")} />
        {products.length === 0 ? (
          <DraftHint>{hint}</DraftHint>
        ) : node.variation === "carousel" ? (
          <ul
            className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:gap-6 sm:px-6 lg:-mx-8 lg:scroll-px-8 lg:px-8 [&::-webkit-scrollbar]:hidden"
            aria-label={title ?? m.blocks.products}
            tabIndex={0}
            {...listField}
          >
            {products.map((product) => (
              <li key={product.id} className="w-[70%] shrink-0 snap-start sm:w-[42%] lg:w-[23%]">
                <ProductCard product={product} showPrice={showPrices} sizes="(min-width: 1024px) 23vw, (min-width: 640px) 42vw, 70vw" />
              </li>
            ))}
          </ul>
        ) : (
          <ProductCardGrid products={products} columns={columns ?? "4"} showPrices={showPrices} attributes={listField} />
        )}
      </Container>
    </section>
  );
}
