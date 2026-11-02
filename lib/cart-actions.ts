"use server";

import { refresh } from "next/cache";
import { CartError } from "@spindlecommerce/storefront-client";
import { storefront } from "./storefront";
import type { Translator } from "./i18n";
import { getT, inMarket } from "./market";

// Each action takes the calling page's market first: Server Actions cannot read the route's.

export type AddToCartState = { status: "idle" | "added" | "error"; message: string | null; totalQuantity: number | null; key: number };

const quantityFrom = (value: FormDataEntryValue | null, fallback = 1) => {
  const n = Number(value);
  return Number.isInteger(n) ? Math.min(Math.max(n, 0), 99) : fallback;
};

export async function addToCartAction(market: string, _previous: AddToCartState, form: FormData): Promise<AddToCartState> {
  return inMarket(market, () => addToCartIn(form));
}

/** The API's message is English, so use the storefront's own text. */
const addProblem = (error: CartError, t: Translator) => {
  if (error.code !== "INSUFFICIENT_STOCK") return t.m.product.cannotAdd;
  return error.available ? t.p(t.m.product.onlyAvailable, error.available) : t.m.product.noneLeft;
};

const addToCartIn = async (form: FormData): Promise<AddToCartState> => {
  const t = await getT();
  const variantId = form.get("variantId");
  const quantity = Math.max(quantityFrom(form.get("quantity")), 1);
  if (typeof variantId !== "string" || !variantId) return { status: "error", message: t.m.product.chooseOptions, totalQuantity: null, key: Date.now() };
  try {
    const cart = await (await storefront.cart()).add([{ variantId, quantity }]);
    return { status: "added", message: t.p(t.m.product.added, quantity), totalQuantity: cart.totalQuantity, key: Date.now() };
  } catch (error) {
    const message = error instanceof CartError ? addProblem(error, t) : t.m.product.addFailed;
    if (!(error instanceof CartError)) console.error("Add to cart failed", error);
    return { status: "error", message, totalQuantity: null, key: Date.now() };
  }
};

/** Form fields lineId and quantity; 0 removes the line. */
export async function updateCartLineAction(market: string, form: FormData): Promise<void> {
  return inMarket(market, () => updateCartLineIn(form));
}

const updateCartLineIn = async (form: FormData): Promise<void> => {
  const lineId = form.get("lineId");
  const raw = form.get("quantity");
  const quantity = typeof raw === "string" && raw.trim() !== "" ? Number(raw) : Number.NaN;
  if (typeof lineId !== "string" || !lineId || !Number.isInteger(quantity) || quantity < 0) return;
  try {
    await (await storefront.cart()).update(lineId, Math.min(quantity, 99));
  } catch (error) {
    // Not worth an error page: the cart re-renders as it is.
    if (!(error instanceof CartError)) console.error("Cart update failed", error);
  }
  refresh();
};
