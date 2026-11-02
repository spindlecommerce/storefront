import { ProductOverview } from "@/components/product/product-overview";
import { Container } from "@/components/ui/container";
import type { ProductDetailsNode } from "@/lib/builder-components";
import type { NodeProps } from "./context";
import { NoTemplateData } from "./no-template-data";

/** The built-in product page's top. Only the note is editable here; the rest is catalog data. */
export function ProductDetails({ node, ctx }: NodeProps<ProductDetailsNode>) {
  const { product } = ctx;
  if (!product) return <NoTemplateData node={node} ctx={ctx} kind="product" />;
  const { note, showBreadcrumbs } = node.fields;
  const e = ctx.edit;
  return (
    <section className="pt-8 pb-12 sm:pt-12 sm:pb-16" {...e.node(node)}>
      <Container>
        <ProductOverview
          product={product}
          breadcrumbs={showBreadcrumbs}
          galleryPosition={node.variation === "gallery_right" ? "right" : "left"}
          note={note ? <p {...e.text(node.id, "note")}>{note}</p> : null}
        />
      </Container>
    </section>
  );
}
