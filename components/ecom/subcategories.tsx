import { SubcategoryLinks } from "@/components/category/subcategory-links";
import { Container } from "@/components/ui/container";
import { cx } from "@/lib/cx";
import type { SubcategoriesNode } from "@/lib/builder-components";
import type { NodeProps } from "./context";
import { DraftHint } from "./draft-hint";
import { NoTemplateData } from "./no-template-data";

export function Subcategories({ node, ctx }: NodeProps<SubcategoriesNode>) {
  const { category } = ctx;
  if (!category) return <NoTemplateData node={node} ctx={ctx} kind="category" />;
  const { title } = node.fields;
  const e = ctx.edit;
  const cards = node.variation === "cards";
  if (!category.children.length) {
    if (!ctx.draft) return null;
    return (
      <section className="py-4" {...e.node(node)}>
        <Container>
          <DraftHint>{category.name} has no subcategories, so visitors see nothing here.</DraftHint>
        </Container>
      </section>
    );
  }
  return (
    <section className={cards ? "py-10 sm:py-14" : "py-4"} {...e.node(node)}>
      <Container>
        {title && (
          <h2 className={cx("text-balance font-semibold tracking-tight", cards ? "mb-8 text-2xl sm:text-3xl" : "mb-4 text-lg")} {...e.text(node.id, "title")}>
            {title}
          </h2>
        )}
        <SubcategoryLinks categories={category.children} variant={cards ? "cards" : "pills"} />
      </Container>
    </section>
  );
}
