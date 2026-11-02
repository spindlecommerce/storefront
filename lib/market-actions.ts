"use server";

import { cookies } from "next/headers";
import { CartError } from "@spindlecommerce/storefront-client";
import { getMarket, inMarket } from "./market";
import { CURRENCY_COOKIE, isCurrency, isLocale } from "./markets";
import { storefront } from "./storefront";

/**
 * The picker's action: saves the currency cookie proxy.ts reads, and moves the cart. `market` is
 * the page's, since Server Actions cannot read the route's.
 */
export async function changeMarketAction(market: string, change: { locale?: string; currency?: string }): Promise<void> {
  return inMarket(market, async () => {
    const current = await getMarket();
    const locale = isLocale(change.locale) ? change.locale : current.locale;
    const currency = isCurrency(change.currency) ? change.currency.toUpperCase() : current.currency;
    if (currency !== current.currency) {
      (await cookies()).set(CURRENCY_COOKIE, currency, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365 });
    }
    if (locale === current.locale && currency === current.currency) return;
    try {
      await (await storefront.cart()).move({ locale, currency });
    } catch (error) {
      // The page still changes; the cart keeps its own language and currency.
      if (!(error instanceof CartError)) console.error("Could not move the cart to the new language and currency", error);
    }
  });
}
