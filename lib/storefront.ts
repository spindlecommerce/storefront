import "server-only";
import { createNextStorefront } from "@spindlecommerce/storefront-next";
import type { SiteFooterNode, SiteHeaderNode } from "./builder-components";
import { config } from "./config";
import { getMarket } from "./market";
import { isCurrency } from "./markets";

/** The Storefront API in the request's market, cached by tag outside draft mode. */
export const storefront = createNextStorefront({
  url: config.apiUrl,
  market: getMarket,
  // Publishing revalidates through /api/revalidate; the short lifetime in development covers an
  // API whose webhooks cannot reach localhost.
  revalidate: process.env.NODE_ENV === "development" ? 5 : 300,
  // A cart in another currency belongs to another channel: it is left alone, and adding to the
  // cart starts a new one.
  isUsableCart: (cart) => cart.isOpen && isCurrency(cart.currencyCode),
});

export const { getRoute, getNewestProducts, getCategoryProducts, getLocalizedPath, getSitemap } = storefront;

export const getSite = () => storefront.getSite<SiteHeaderNode, SiteFooterNode>();

export type SiteData = Awaited<ReturnType<typeof getSite>>;

export { isPreviewExpired, type ProductSort } from "@spindlecommerce/storefront-client";
