/** Language prefixes on storefront paths (/de/products/x), usable in client components. */

/** Absolute URLs and anchors stay as they are. */
export const withPrefix = (href: string, prefix: string) => {
  if (!prefix || !href.startsWith("/") || href.startsWith("//")) return href;
  return href === "/" || /^\/[?#]/.test(href) ? `/${prefix}${href.slice(1)}` : `/${prefix}${href}`;
};

export const withoutPrefix = (pathname: string, prefix: string) => {
  if (!prefix) return pathname;
  if (pathname === `/${prefix}`) return "/";
  return pathname.startsWith(`/${prefix}/`) ? pathname.slice(prefix.length + 1) : pathname;
};

/** Prefixes internal links (href="/…") in rendered Markdown and catalog descriptions. */
export const localizeLinks = (html: string, prefix: string) => (prefix ? html.replace(/href="(\/(?!\/)[^"]*)"/g, (_, path: string) => `href="${withPrefix(path, prefix)}"`) : html);
