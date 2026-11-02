import type { MetadataRoute } from "next";
import { config } from "@/lib/config";
import { LOCALES, localizePath } from "@/lib/markets";

export default function robots(): MetadataRoute.Robots {
  const shopperOnly = LOCALES.flatMap((locale) => [localizePath("/cart", locale), localizePath("/checkout", locale)]);
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", ...shopperOnly] },
    sitemap: `${config.siteUrl}/sitemap.xml`,
  };
}
