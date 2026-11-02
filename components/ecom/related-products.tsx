import { unstable_rethrow } from "next/navigation";
import { ProductCardGrid } from "@/components/product/product-card-grid";
import { deepestCategory } from "@/components/product/product-overview";
import { Container } from "@/components/ui/container";
import { getCategoryProducts, getNewestProducts, isPreviewExpired } from "@/lib/storefront";
import type { RelatedProductsNode } from "@/lib/builder-components";
import type { ProductSummary } from "@/lib/types";
import type { NodeProps } from "./context";
import { DraftHint } from "./draft-hint";
import { NoTemplateData } from "./no-template-data";
import { SectionHeader } from "./section-header";

/** From the product's deepest category or the newest arrivals, without the product itself. */
export async function RelatedProducts({ node, ctx }: NodeProps<RelatedProductsNode>) {
  const { product } = ctx;
  if (!product) return <NoTemplateData node={node} ctx={ctx} kind="product" />;
  const { title, source, limit, showPrices } = node.fields;
  const e = ctx.edit;
  const count = Math.min(Math.max(Math.round(limit ?? 4), 2), 12);
  const from = source ?? "category";
  const category = deepestCategory(product);

  let products: ProductSummary[] = [];
  let problem: string | null = null;
  try {
    // One more than shown, in case this product is among them.
    const found = from === "newest" ? await getNewestProducts(count + 1) : category ? (await getCategoryProducts(category.id, count + 1)).products : [];
    products = found.filter((p) => p.id !== product.id).slice(0, count);
  } catch (error) {
    unstable_rethrow(error);
    if (isPreviewExpired(error)) throw error;
    // Related products should not take the product page down.
    console.error(`related_products ${node.id}: could not load products`, error);
    problem = "The products could not be loaded.";
  }
  if (!products.length && !ctx.draft) return null;

  const hint = problem ?? (from === "category" && !category ? "This product is in no category, so visitors see nothing here." : "No other products to show, so visitors see nothing here.");
  return (
    <section className="py-12 sm:py-16" {...e.node(node)}>
      <Container>
        <SectionHeader title={title} titleAttributes={e.text(node.id, "title")} />
        {products.length ? <ProductCardGrid products={products} showPrices={showPrices} attributes={e.field(node.id, "source")} /> : <DraftHint>{hint}</DraftHint>}
      </Container>
    </section>
  );
}
