"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { translator, type Messages } from "@/lib/i18n/translate";
import { withPrefix } from "@/lib/locale-path";
import type { MarketOptions } from "@/lib/markets";

/** The page's market and messages for client components, provided by the root layout. */
const MarketContext = createContext<{ options: MarketOptions; messages: Messages } | null>(null);

export function MarketProvider({ value, messages, children }: { value: MarketOptions; messages: Messages; children: ReactNode }) {
  const context = useMemo(() => ({ options: value, messages }), [value, messages]);
  return <MarketContext value={context}>{children}</MarketContext>;
}

const useContextValue = () => {
  const context = useContext(MarketContext);
  if (!context) throw new Error("useMarket needs a MarketProvider (app/[market]/layout.tsx)");
  return context;
};

export const useMarket = () => useContextValue().options;

export const useT = () => {
  const { options, messages } = useContextValue();
  const { locale } = options.current;
  return useMemo(() => translator(locale, messages), [locale, messages]);
};

/** A storefront path in the page's language: /cart → /de/cart. */
export const useLocalize = () => {
  const { prefix } = useMarket().current;
  return (path: string) => withPrefix(path, prefix);
};
