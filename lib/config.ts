import "server-only";

const withoutTrailingSlash = (url: string) => url.replace(/\/+$/, "");

const originOf = (url: string) => {
  try {
    return new URL(url).origin;
  } catch {
    return url;
  }
};

const apiUrl = withoutTrailingSlash(process.env.SPINDLE_API_URL || "http://localhost:4000");

/** Server-side settings from the environment; see .env.example. */
export const config = {
  apiUrl,
  // The channel, languages and currencies are in lib/markets.ts.
  /** Verifies webhook signatures on /api/revalidate. */
  revalidateSecret: process.env.SPINDLE_REVALIDATE_SECRET || null,
  /** For previews that name no admin. Defaults to the API's origin, which serves the admin. */
  adminOrigin: (process.env.SPINDLE_ADMIN_ORIGIN || "").split(/[\s,]+/).filter(Boolean)[0] ?? originOf(apiUrl),
  /** This storefront's public URL, for absolute links. */
  siteUrl: withoutTrailingSlash(
    process.env.SPINDLE_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  ),
};
