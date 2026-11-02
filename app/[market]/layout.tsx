import { visualEditingBridgeUrl } from "@spindlecommerce/storefront-client";
import { GeistMono } from "geist/font/mono";
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { cookies, draftMode } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import type { ReactNode } from "react";
import { MarketProvider } from "@/components/market-provider";
import { PreviewBadge } from "@/components/preview/preview-badge";
import { VisualEditing } from "@/components/preview/visual-editing";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { config } from "@/lib/config";
import { cx } from "@/lib/cx";
import { getSite, isPreviewExpired, type SiteData } from "@/lib/storefront";
import { getMarket, getT } from "@/lib/market";
import { marketOptions } from "@/lib/markets";
import { PREVIEW_COOKIE } from "@spindlecommerce/storefront-next";
import "../globals.css";

/** The brand font, self-hosted by Next.js at build time. */
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-jakarta", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    metadataBase: new URL(config.siteUrl),
    title: { default: "SpindleCommerce", template: "%s · SpindleCommerce" },
    description: t.m.site.description,
  };
}

export const viewport: Viewport = { themeColor: "#ffffff" };

/** A broken API or an expired preview still renders the page, without header and footer. */
const loadSite = async (): Promise<SiteData> => {
  try {
    return await getSite();
  } catch (error) {
    unstable_rethrow(error);
    if (!isPreviewExpired(error)) console.error("Could not load the site header and footer", error);
    return { header: null, footer: null, localization: null };
  }
};

/** Draft mode only: the visual editing bridge, and a badge for direct visits. */
async function PreviewTools() {
  const jar = await cookies();
  const adminOrigin = jar.get(PREVIEW_COOKIE.adminOrigin)?.value || config.adminOrigin;
  return (
    <>
      <VisualEditing adminOrigin={adminOrigin} bridgeUrl={visualEditingBridgeUrl(config.apiUrl)} />
      <PreviewBadge />
    </>
  );
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { isEnabled: draft } = await draftMode();
  const market = await getMarket();
  const t = await getT();
  const site = await loadSite();
  return (
    <html lang={market.locale} className={cx(jakarta.variable, GeistMono.variable)}>
      <body className="flex min-h-dvh flex-col bg-canvas font-sans text-ink antialiased">
        <MarketProvider value={marketOptions(market)} messages={t.m}>
          <a href="#main" className="skip-link">
            {t.m.site.skipToContent}
          </a>
          <SiteHeader header={site.header} draft={draft} />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter footer={site.footer} draft={draft} />
          {draft && <PreviewTools />}
        </MarketProvider>
      </body>
    </html>
  );
}
