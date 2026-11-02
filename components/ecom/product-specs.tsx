import { productSpecs, SpecList } from "@/components/product/product-info";
import type { ProductSpecsNode } from "@/lib/builder-components";
import type { NodeProps } from "./context";
import { DraftHint } from "./draft-hint";
import { NoTemplateData } from "./no-template-data";
import { ProductInfoSection } from "./product-info-section";

/** The attributes are catalog data; only the title is editable here. */
export function ProductSpecs({ node, ctx }: NodeProps<ProductSpecsNode>) {
  const { product } = ctx;
  if (!product) return <NoTemplateData node={node} ctx={ctx} kind="product" />;
  const specs = productSpecs(product);
  if (!specs.length && !ctx.draft) return null;
  const e = ctx.edit;
  return (
    <ProductInfoSection title={node.fields.title} titleAttributes={e.text(node.id, "title")} attributes={e.node(node)}>
      {specs.length ? <SpecList specs={specs} /> : <DraftHint>This product has no attributes to list, so visitors see nothing here.</DraftHint>}
    </ProductInfoSection>
  );
}
