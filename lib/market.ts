import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";
import { market as marketParam } from "next/root-params";
import { cache } from "react";
import { translatorFor } from "./i18n";
import { localizePath, type Market, parseMarket } from "./markets";

/**
 * The request's market, from the [market] root segment. Server Actions and Route Handlers cannot
 * read root params, so they run their work in `inMarket` with the market the page gave them.
 */

const given = new AsyncLocalStorage<Market>();

export const inMarket = <T>(key: string | null | undefined, work: () => Promise<T>) => given.run(parseMarket(key), work);

export const getMarket = cache(async (): Promise<Market> => given.getStore() ?? parseMarket(await marketParam()));

export const localized = async (path: string) => localizePath(path, (await getMarket()).locale);

export const getT = cache(async () => translatorFor((await getMarket()).locale));
