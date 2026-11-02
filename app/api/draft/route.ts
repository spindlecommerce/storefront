import { createDraftRoute } from "@spindlecommerce/storefront-next";
import { CHANNEL, isLocale, localizePath } from "@/lib/markets";
import { storefront } from "@/lib/storefront";

/** The preview route the admin frames. Previews of this storefront's channel open in their language. */
export const GET = createDraftRoute(storefront, {
  channel: CHANNEL,
  location: (path, { locale, channel }) => (isLocale(locale) && (!channel || channel === CHANNEL) ? localizePath(path, locale) : path),
});
