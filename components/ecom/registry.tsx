import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import type { CategorySectionsNode, BuilderComponentCode, BuilderComponentNode, BuilderContentTypeCode, BuilderContentTypeNode, ProductSectionsNode } from "@/lib/builder-components";
import type { BuilderPage } from "@/lib/types";
import { blockNodes, containsComponent } from "@spindlecommerce/storefront-client";
import { createRenderer } from "@spindlecommerce/storefront-react";
import { Button } from "./button";
import { CategoryHeader } from "./category-header";
import { CategoryProducts } from "./category-products";
import { CategoryTiles } from "./category-tiles";
import { Column, Columns } from "./columns";
import type { ContentNode, NodeProps, OwnContext, RenderContext } from "./context";
import { DraftHint } from "./draft-hint";
import { Faq } from "./faq";
import { FeatureList } from "./feature-list";
import { FooterColumn } from "./footer-column";
import { Hero } from "./hero";
import { ImageBlock } from "./image-block";
import { ImageWithText } from "./image-with-text";
import { LogoCloud } from "./logo-cloud";
import { Newsletter } from "./newsletter";
import { NoTemplateData } from "./no-template-data";
import { ProductDescription } from "./product-description";
import { ProductDetails } from "./product-details";
import { ProductGrid } from "./product-grid";
import { ProductSpecs } from "./product-specs";
import { PromoBanner } from "./promo-banner";
import { RelatedProducts } from "./related-products";
import { RichText } from "./rich-text";
import { Spacer } from "./spacer";
import { Subcategories } from "./subcategories";
import { Testimonials } from "./testimonials";
import { TextBlock } from "./text-block";
import { UnknownComponent } from "./unknown";
import { Video } from "./video";

type Renderer<N> = (props: NodeProps<N>) => ReactNode | Promise<ReactNode>;

/**
 * One React component per code in components.json. A code in the generated types without an
 * entry here is a type error.
 */
const COMPONENTS: { [C in BuilderComponentCode]: Renderer<Extract<BuilderComponentNode, { component: C }>> } = {
  hero: Hero,
  rich_text: RichText,
  product_grid: ProductGrid,
  category_tiles: CategoryTiles,
  promo_banner: PromoBanner,
  image_with_text: ImageWithText,
  feature_list: FeatureList,
  testimonials: Testimonials,
  faq: Faq,
  newsletter: Newsletter,
  columns: Columns,
  column: Column,
  video: Video,
  logo_cloud: LogoCloud,
  spacer: Spacer,
  button: Button,
  text_block: TextBlock,
  image_block: ImageBlock,
  footer_column: FooterColumn,
  // Product templates: they show ctx.product.
  product_details: ProductDetails,
  product_description: ProductDescription,
  product_specs: ProductSpecs,
  related_products: RelatedProducts,
  product_sections: OwnSections,
  // Category templates: they show ctx.category.
  category_header: CategoryHeader,
  subcategories: Subcategories,
  category_products: CategoryProducts,
  category_sections: OwnSections,
};

type Layout<N> = (root: N) => readonly ContentNode[];

/**
 * The sections each content type renders, in order. components/site lays out the header and
 * footer. A content type in the generated types without an entry here is a type error.
 */
const LAYOUTS: { [C in Exclude<BuilderContentTypeCode, "site_header" | "site_footer">]: Layout<Extract<BuilderContentTypeNode, { component: C }>> } = {
  landing_page: (root) => root.fields.sections ?? [],
  product_page: (root) => root.fields.sections ?? [],
  category_page: (root) => root.fields.sections ?? [],
  product_sections_page: (root) => root.fields.sections ?? [],
  category_sections_page: (root) => root.fields.sections ?? [],
};

const layoutOf = (root: ContentNode) => (LAYOUTS as unknown as Record<string, Layout<ContentNode> | undefined>)[root.component] ?? null;

/** Without a layout, the components in the content type's blocks fields, in order. */
const sectionsOf = (root: ContentNode) => layoutOf(root)?.(root) ?? blockNodes(root);

export const { RenderNode, contextFor } = createRenderer<OwnContext>({ components: COMPONENTS, fallback: UnknownComponent });

export type TemplateData = Pick<RenderContext, "product" | "category" | "searchParams" | "sections">;

/** For one document: a page, a template, the header or the footer. */
export const createRenderContext = (page: Pick<BuilderPage, "references">, draft: boolean, tone: RenderContext["tone"] = "light", data: TemplateData = {}): RenderContext =>
  contextFor(page, draft, { ...data, tone, aboveFold: false });

/** Number of leading sections whose images load eagerly. */
const ABOVE_FOLD = 2;

/** The h1 to add when no section shows one (product_details, category_header, an early hero). */
const hiddenHeading = (page: Pick<BuilderPage, "title">, sections: readonly ContentNode[], data: TemplateData) => {
  const shows = (code: BuilderComponentCode) => sections.some((section) => section.component === code);
  if (data.product) return shows("product_details") ? null : data.product.name;
  if (data.category) return shows("category_header") ? null : data.category.name;
  return sections.slice(0, ABOVE_FOLD).some((section) => section.component === "hero") ? null : page.title;
};

/** A builder page, or a template rendering the page of `data.product` or `data.category`. */
export function PageContent({ page, draft, data = {} }: { page: BuilderPage; draft: boolean; data?: TemplateData }) {
  const ctx = createRenderContext(page, draft, "light", data);
  const root = page.content as ContentNode;
  const layout = layoutOf(root);
  const sections = sectionsOf(root);
  const top = { ...ctx, aboveFold: true };
  const heading = hiddenHeading(page, sections, data);
  // Editors see own sections the template does not place, so they can still edit them.
  const kind = data.product ? "product" : "category";
  const unplaced = draft && data.sections && !containsComponent(sections, `${kind}_sections`) ? data.sections : null;
  return (
    // Scopes node ids to this document. Keyed by the save in draft mode, so text the bridge
    // patched in place is re-created.
    <div key={draft ? page.updatedAt : undefined} {...ctx.edit.document(page.id)}>
      <div {...ctx.edit.node(root)}>
        {heading && <h1 className="sr-only">{heading}</h1>}
        {!layout && draft && (
          <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
            <DraftHint>
              No layout for the content type <code className="font-mono">{root.component}</code>: its components are shown in order.
            </DraftHint>
          </div>
        )}
        {sections.map((section, i) => (
          <RenderNode key={section.id} node={section} ctx={i < ABOVE_FOLD ? top : ctx} />
        ))}
        {sections.length === 0 && draft && (
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <DraftHint>This page has no sections yet. Add one in the editor.</DraftHint>
          </div>
        )}
      </div>
      {unplaced && (
        <>
          <Container className="pt-10 pb-4">
            <DraftHint>
              Visitors don&apos;t see this {kind}&apos;s own sections below: its template doesn&apos;t place them. Add “This {kind}&apos;s sections” to the template where they should go.
            </DraftHint>
          </Container>
          <SectionsDocument page={unplaced} ctx={ctx} />
        </>
      )}
    </div>
  );
}

/** Where a template shows the product's or category's own sections. */
function OwnSections({ node, ctx }: NodeProps<ProductSectionsNode | CategorySectionsNode>) {
  const kind = node.component === "product_sections" ? "product" : "category";
  if (!(kind === "product" ? ctx.product : ctx.category)) return <NoTemplateData node={node} ctx={ctx} kind={kind} />;
  if (!ctx.sections) {
    if (!ctx.draft) return null;
    return (
      <div className="py-6" {...ctx.edit.node(node)}>
        <Container>
          <DraftHint>This {kind}&apos;s own sections show here. It has none yet: add them from the {kind}&apos;s screen in the admin.</DraftHint>
        </Container>
      </div>
    );
  }
  return (
    <div {...ctx.edit.node(node)}>
      <SectionsDocument page={ctx.sections} ctx={ctx} />
    </div>
  );
}

/**
 * Own sections are a separate document with their own references, rendered with the page's product
 * or category.
 */
function SectionsDocument({ page, ctx }: { page: BuilderPage; ctx: RenderContext }) {
  // No `sections` inside: their components cannot show sections again.
  const inner = createRenderContext(page, ctx.draft, ctx.tone, { product: ctx.product, category: ctx.category, searchParams: ctx.searchParams });
  const root = page.content as ContentNode;
  const sections = sectionsOf(root);
  return (
    <div key={ctx.draft ? page.updatedAt : undefined} {...inner.edit.document(page.id)}>
      <div {...inner.edit.node(root)}>
        {sections.map((section) => (
          <RenderNode key={section.id} node={section} ctx={inner} />
        ))}
        {sections.length === 0 && ctx.draft && (
          <Container className="py-6">
            <DraftHint>These sections are empty. Add components to them in the editor.</DraftHint>
          </Container>
        )}
      </div>
    </div>
  );
}
