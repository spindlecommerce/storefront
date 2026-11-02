import { type NextRequest, NextResponse } from "next/server";
import { CURRENCY_COOKIE, DEFAULT_CURRENCY, isCurrency, marketKey, splitPath } from "./lib/markets";

/**
 * Rewrites each page to its market's route (/de/x → /de-DE~EUR/x, see lib/markets.ts) and lets the
 * admin frame the storefront for visual editing. The frame header is set here rather than in
 * next.config.ts so SPINDLE_ADMIN_ORIGIN is read at runtime, not at build time.
 */
const frameAncestors = () =>
  (process.env.SPINDLE_ADMIN_ORIGIN || process.env.SPINDLE_API_URL || "http://localhost:4000")
    .split(/[\s,]+/)
    .filter(Boolean)
    .flatMap((value) => {
      try {
        return [new URL(value).origin];
      } catch {
        return [];
      }
    });

/** Anything with an extension is a public file. */
const isPage = (pathname: string) => !pathname.startsWith("/api/") && !pathname.startsWith("/_next/") && !/\.[^/]*$/.test(pathname);

const route = (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  if (!isPage(pathname)) return NextResponse.next();
  const { locale, path, alias } = splitPath(pathname);
  const url = request.nextUrl.clone();
  // The default language has no prefix: /en/… is the plain URL.
  if (alias) {
    url.pathname = path;
    return NextResponse.redirect(url, 308);
  }
  const cookie = request.cookies.get(CURRENCY_COOKIE)?.value;
  const currency = isCurrency(cookie) ? cookie.toUpperCase() : DEFAULT_CURRENCY;
  url.pathname = `/${encodeURIComponent(marketKey({ locale, currency }))}${path === "/" ? "" : path}`;
  return NextResponse.rewrite(url);
};

export function proxy(request: NextRequest) {
  const response = route(request);
  response.headers.set("Content-Security-Policy", `frame-ancestors 'self' ${frameAncestors().join(" ")}`);
  return response;
}

export const config = {
  // Pages and the preview route. Static files and optimized images are never framed.
  matcher: ["/((?!_next/static|_next/image|icon.svg|robots.txt|sitemap.xml).*)"],
};
