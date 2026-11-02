import { withPrefix } from "./locale-path";

/**
 * The markets this storefront serves. The language is the URL prefix and the currency a cookie;
 * proxy.ts rewrites both into the /[market] segment so each market renders and caches on its own.
 */

const list = (value: string | undefined, fallback: string[]) => {
  const items = (value ?? "").split(/[\s,]+/).filter(Boolean);
  return items.length ? items : fallback;
};

export const CHANNEL = process.env.SPINDLE_CHANNEL || "eu";
/** The first is the default, which has no URL prefix. */
export const LOCALES = list(process.env.SPINDLE_LOCALES, ["en-GB", "de-DE", "fr-FR"]);
export const CURRENCIES = list(process.env.SPINDLE_CURRENCIES, ["GBP", "EUR"]).map((code) => code.toUpperCase());
export const DEFAULT_LOCALE = LOCALES[0]!;
export const DEFAULT_CURRENCY = CURRENCIES[0]!;

/** Set by the picker. The language is in the URL, so it needs no cookie. */
export const CURRENCY_COOKIE = "ecom_currency";

export type Market = { channel: string; locale: string; currency: string };

const language = (locale: string) => locale.split("-")[0]!.toLowerCase();

/** The language code, or the whole locale when two locales share a language; "" for the default. */
export const prefixFor = (locale: string) => {
  if (locale === DEFAULT_LOCALE) return "";
  return LOCALES.filter((other) => language(other) === language(locale)).length > 1 ? locale.toLowerCase() : language(locale);
};

const BY_PREFIX = new Map(LOCALES.filter((locale) => locale !== DEFAULT_LOCALE).map((locale) => [prefixFor(locale), locale]));
/** Prefixes for the default language, which redirect to the plain URL: /en/… → /…. */
const DEFAULT_ALIASES = new Set([language(DEFAULT_LOCALE), DEFAULT_LOCALE.toLowerCase()].filter((alias) => !BY_PREFIX.has(alias)));

/** `alias` is true when the prefix names the default language (/en/…). */
export const splitPath = (pathname: string): { locale: string; path: string; alias: boolean } => {
  const match = /^\/([^/]+)(\/.*)?$/.exec(pathname);
  const first = match?.[1]?.toLowerCase();
  const rest = match?.[2] || "/";
  const locale = first ? BY_PREFIX.get(first) : undefined;
  if (locale) return { locale, path: rest, alias: false };
  if (first && DEFAULT_ALIASES.has(first)) return { locale: DEFAULT_LOCALE, path: rest, alias: true };
  return { locale: DEFAULT_LOCALE, path: pathname, alias: false };
};

export const isLocale = (value: string | null | undefined): value is string => !!value && LOCALES.includes(value);
export const isCurrency = (value: string | null | undefined): value is string => !!value && CURRENCIES.includes(value.toUpperCase());

/** The route segment proxy.ts rewrites to, e.g. "de-DE~EUR". */
export const marketKey = (market: Pick<Market, "locale" | "currency">) => `${market.locale}~${market.currency}`;

const decode = (key: string) => {
  try {
    return decodeURIComponent(key);
  } catch {
    return "";
  }
};

/** Unknown locales and currencies fall back to the defaults, as does a malformed key. */
export const parseMarket = (key: string | null | undefined): Market => {
  const [locale, currency] = decode(key ?? "").split("~");
  return { channel: CHANNEL, locale: isLocale(locale) ? locale : DEFAULT_LOCALE, currency: isCurrency(currency) ? currency.toUpperCase() : DEFAULT_CURRENCY };
};

/** A storefront path in a language: /products/x → /de/products/x. */
export const localizePath = (path: string, locale: string) => withPrefix(path, prefixFor(locale));

const capitalize = (text: string, locale: string) => text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);

/** A language's name in that language: English, Deutsch, Français. */
export const languageName = (locale: string) => capitalize(new Intl.DisplayNames([locale], { type: "language" }).of(language(locale)) ?? locale, locale);

export const currencySymbol = (currency: string, locale: string) =>
  new Intl.NumberFormat(locale, { style: "currency", currency, currencyDisplay: "narrowSymbol" }).formatToParts(0).find((part) => part.type === "currency")?.value ?? currency;

/** What the picker offers, for client components. */
export type MarketOptions = {
  current: { locale: string; currency: string; prefix: string; key: string };
  languages: { locale: string; prefix: string; name: string }[];
  currencies: { code: string; symbol: string }[];
};

export const marketOptions = (market: Market): MarketOptions => ({
  current: { locale: market.locale, currency: market.currency, prefix: prefixFor(market.locale), key: marketKey(market) },
  languages: LOCALES.map((locale) => ({ locale, prefix: prefixFor(locale), name: languageName(locale) })),
  currencies: CURRENCIES.map((code) => ({ code, symbol: currencySymbol(code, market.locale) })),
});
