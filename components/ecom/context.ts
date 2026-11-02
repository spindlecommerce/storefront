import type { NodeProps as Props, RenderContext as Context } from "@spindlecommerce/storefront-react";
import type { Tone } from "@/components/ui/button";
import type { BuilderPage, Category, Product, SearchParams } from "@/lib/types";

export type { ContentNode } from "@spindlecommerce/storefront-client";

/** What this storefront adds to every component's context. */
export type OwnContext = {
  /** In a product template: the product whose page it renders. */
  product?: Product;
  /** In a category template: the category whose page it renders. */
  category?: Category;
  /** In a category template: the page's query string, for sorting and pages. */
  searchParams?: SearchParams;
  /** Own sections, for product_sections or category_sections. Never set inside them. */
  sections?: BuilderPage | null;
  /** Colour scheme of the surrounding section; buttons and links follow it. */
  tone: Tone;
  /** The first sections of a page load their images eagerly. */
  aboveFold: boolean;
};

export type RenderContext = Context<OwnContext>;

export type NodeProps<N> = Props<N, OwnContext>;
