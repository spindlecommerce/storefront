import { CategoryListing } from "@/components/category/category-listing";
import { Container } from "@/components/ui/container";
import type { CategoryProductsNode } from "@/lib/builder-components";
import type { NodeProps } from "./context";
import { NoTemplateData } from "./no-template-data";

/** Lists products like the built-in category page, with the same query string. */
export function CategoryProducts({ node, ctx }: NodeProps<CategoryProductsNode>) {
  const { category } = ctx;
  if (!category) return <NoTemplateData node={node} ctx={ctx} kind="category" />;
  const { pageSize, columns, showSort, showPrices } = node.fields;
  return (
    <section className="pt-6 pb-12 sm:pb-16" {...ctx.edit.node(node)}>
      <Container>
        <CategoryListing
          category={category}
          searchParams={ctx.searchParams ?? {}}
          pageSize={Math.min(Math.max(Math.round(pageSize ?? 12), 4), 48)}
          columns={columns ?? "3"}
          showSort={showSort}
          showPrices={showPrices}
        />
      </Container>
    </section>
  );
}
