import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { CategoryView } from "@/components/category/category-view";
import { PageContent } from "@/components/ecom/registry";
import { PreviewExpired } from "@/components/preview/preview-expired";
import { ProductJsonLd } from "@/components/product/product-json-ld";
import { ProductView } from "@/components/product/product-view";
import { config } from "@/lib/config";
import { getLocalizedPath, getRoute, isPreviewExpired } from "@/lib/storefront";
import { imageUrl } from "@/lib/images";
import { getT, localized } from "@/lib/market";
import { DEFAULT_LOCALE, LOCALES, localizePath } from "@/lib/markets";
import { categoryPath, normalizePath, pathFromSegments, productPath } from "@/lib/paths";
import type { RouteResult, SearchParams } from "@/lib/types";

/** Every storefront URL. Products and categories without a template use the built-in layout. */

type Props = {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<SearchParams>;
};

/** "expired": the preview token no longer works. */
const resolve = async (path: string): Promise<RouteResult | null | "expired"> => {
  try {
    return await getRoute(path);
  } catch (error) {
    if (isPreviewExpired(error)) return "expired";
    throw error;
  }
};

const canonicalPath = (route: RouteResult, requested: string) => {
  if (route.__typename === "Product") return productPath(route.slug);
  if (route.__typename === "Category") return categoryPath(route.path);
  if (route.__typename === "Page") return route.path ?? requested;
  return requested;
};

const plainText = (html: string | null | undefined) =>
  html
    ?.replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160) || undefined;

/** hreflang URLs. A page has one path in every language; product and category slugs differ. */
const languageAlternates = async (route: RouteResult, path: string) => {
  const pathIn = async (locale: string) => {
    if (route.__typename === "Product" || route.__typename === "Category") {
      const slug = route.id ? await getLocalizedPath(route.id, locale) : null;
      return slug ? (route.__typename === "Product" ? productPath(slug) : categoryPath(slug)) : null;
    }
    return canonicalPath(route, path);
  };
  const languages: Record<string, string> = {};
  for (const [locale, at] of await Promise.all(LOCALES.map(async (locale) => [locale, await pathIn(locale)] as const))) {
    if (at) languages[locale] = localizePath(at, locale);
  }
  const fallback = languages[DEFAULT_LOCALE];
  if (fallback) languages["x-default"] = fallback;
  return languages;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const path = pathFromSegments((await params).path);
  const { isEnabled: draft } = await draftMode();
  const route = await resolve(path);
  const hidden = { index: false, follow: false };
  if (route === "expired") return { title: "Preview expired", robots: hidden };
  if (!route) return { title: (await getT()).m.site.pageNotFound, robots: hidden };
  const robots = draft ? hidden : undefined;
  const alternates = { canonical: await localized(canonicalPath(route, path)), languages: draft || route.__typename === "Redirect" ? undefined : await languageAlternates(route, path) };

  switch (route.__typename) {
    case "Page": {
      const image = route.seo.image;
      return {
        // An SEO title is a complete title; the page title gets the site name appended.
        title: route.seo.title ? { absolute: route.seo.title } : (route.title ?? undefined),
        description: route.seo.description ?? undefined,
        robots: draft || route.seo.noIndex ? hidden : undefined,
        alternates,
        openGraph: image ? { images: [{ url: imageUrl(image.url), alt: image.alt ?? undefined, width: image.width ?? undefined, height: image.height ?? undefined }] } : undefined,
      };
    }
    case "Product": {
      const image = route.media.find((m) => m.kind === "IMAGE");
      return {
        title: route.seo?.title ?? route.name,
        description: route.seo?.description ?? plainText(route.description),
        robots,
        alternates,
        openGraph: { type: "website", images: image ? [{ url: imageUrl(image.url), alt: image.alt ?? route.name }] : undefined },
      };
    }
    case "Category":
      return { title: route.name, description: plainText(route.description), robots, alternates };
    case "Redirect":
      return {};
  }
}

export default async function CatchAllPage({ params, searchParams }: Props) {
  const path = pathFromSegments((await params).path);
  const { isEnabled: draft } = await draftMode();
  const route = await resolve(path);
  if (route === "expired") return <PreviewExpired path={await localized(path)} />;
  if (!route) notFound();

  // Products and categories also resolve by bare slug or an old URL: redirect to the canonical one.
  if (route.__typename === "Product" || route.__typename === "Category") {
    const canonical = canonicalPath(route, path);
    if (normalizePath(canonical) !== normalizePath(path)) (draft ? redirect : permanentRedirect)(await localized(canonical));
  }

  switch (route.__typename) {
    case "Page":
      return <PageContent page={route} draft={draft} />;
    case "Product":
      return (
        <>
          {route.template ? <PageContent page={route.template} draft={draft} data={{ product: route, sections: route.sections }} /> : <ProductView product={route} />}
          <ProductJsonLd product={route} url={`${config.siteUrl}${await localized(productPath(route.slug))}`} />
        </>
      );
    case "Category": {
      // Only listings read the query string (sorting and pagination).
      const query = await searchParams;
      if (route.template) return <PageContent page={route.template} draft={draft} data={{ category: route, searchParams: query, sections: route.sections }} />;
      return <CategoryView category={route} searchParams={query} />;
    }
    case "Redirect": {
      if (normalizePath(route.location) === normalizePath(path)) notFound();
      if (route.statusCode === 301 || route.statusCode === 308) permanentRedirect(await localized(route.location));
      redirect(await localized(route.location));
    }
  }
}
