import { CategoryHeading } from "@/components/category/category-heading";
import { Container } from "@/components/ui/container";
import { EcomImage } from "@/components/ui/ecom-image";
import type { CategoryHeaderNode } from "@/lib/builder-components";
import type { NodeProps } from "./context";
import { NoTemplateData } from "./no-template-data";

/** Only the image is editable here; the rest is catalog data. */
export function CategoryHeader({ node, ctx }: NodeProps<CategoryHeaderNode>) {
  const { category } = ctx;
  if (!category) return <NoTemplateData node={node} ctx={ctx} kind="category" />;
  const { image, showDescription, showBreadcrumbs } = node.fields;
  const e = ctx.edit;

  if (node.variation === "banner") {
    return (
      <section className="relative isolate flex min-h-[360px] items-end overflow-hidden bg-stone-900 text-white sm:min-h-[440px]" {...e.node(node)}>
        <div className="absolute inset-0 -z-10" {...e.field(node.id, "image")}>
          {image ? (
            <>
              <EcomImage image={image} sizes="100vw" eager={ctx.aboveFold} />
              <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/30 to-black/5" />
            </>
          ) : (
            ctx.draft && <span className="absolute right-4 top-4 text-sm text-white/60">Choose a banner image</span>
          )}
        </div>
        <Container className="py-10 sm:py-14">
          <CategoryHeading category={category} breadcrumbs={showBreadcrumbs} description={showDescription} tone="dark" />
        </Container>
      </section>
    );
  }

  return (
    <section className="pt-8 pb-6 sm:pt-12 sm:pb-8" {...e.node(node)}>
      <Container>
        <CategoryHeading category={category} breadcrumbs={showBreadcrumbs} description={showDescription} />
      </Container>
    </section>
  );
}
