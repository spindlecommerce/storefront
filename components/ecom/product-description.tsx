import { DescriptionHtml, productDescription } from "@/components/product/product-info";
import type { ProductDescriptionNode } from "@/lib/builder-components";
import type { NodeProps } from "./context";
import { DraftHint } from "./draft-hint";
import { NoTemplateData } from "./no-template-data";
import { ProductInfoSection } from "./product-info-section";

/** The description is catalog data; only the title is editable here. */
export function ProductDescription({ node, ctx }: NodeProps<ProductDescriptionNode>) {
  const { product } = ctx;
  if (!product) return <NoTemplateData node={node} ctx={ctx} kind="product" />;
  const html = productDescription(product);
  if (!html && !ctx.draft) return null;
  const e = ctx.edit;
  return (
    <ProductInfoSection title={node.fields.title} titleAttributes={e.text(node.id, "title")} attributes={e.node(node)}>
      {html ? <DescriptionHtml html={html} /> : <DraftHint>This product has no description, so visitors see nothing here.</DraftHint>}
    </ProductInfoSection>
  );
}
