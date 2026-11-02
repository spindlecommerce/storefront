import type { MetadataRoute } from "next";
import { unstable_rethrow } from "next/navigation";
import { connection } from "next/server";
import { config } from "@/lib/config";
import { getSitemap } from "@/lib/storefront";
import { inMarket } from "@/lib/market";
import { DEFAULT_CURRENCY, DEFAULT_LOCALE, LOCALES, localizePath, marketKey } from "@/lib/markets";
import { categoryPath, productPath } from "@/lib/paths";

const url = (path: string) => (path === "/" ? config.siteUrl : `${config.siteUrl}${path}`);

/** One language's landing pages, products and categories, at its own URLs. */
const inLanguage = (locale: string) =>
  inMarket(marketKey({ locale, currency: DEFAULT_CURRENCY }), async (): Promise<MetadataRoute.Sitemap> => {
    const { pages, productSlugs, categoryPaths } = await getSitemap("landing_page");
    const at = (path: string) => url(localizePath(path, locale));
    return [
      ...pages.flatMap((page) => (page.path && !page.seo?.noIndex ? [{ url: at(page.path), lastModified: page.updatedAt ?? undefined }] : [])),
      ...categoryPaths.map((path) => ({ url: at(categoryPath(path)) })),
      ...productSlugs.map((slug) => ({ url: at(productPath(slug)) })),
    ];
  });

/** Every language, since product and category slugs differ by language. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Built per request, not at build time. The lists come from the tagged fetch cache.
  await connection();
  try {
    return (await Promise.all(LOCALES.map(inLanguage))).flat();
  } catch (error) {
    unstable_rethrow(error);
    console.error("Could not build the sitemap", error);
    return [{ url: url(localizePath("/", DEFAULT_LOCALE)) }];
  }
}
