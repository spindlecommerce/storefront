import { selectionOf, type ProductOption, type VariantSummary } from "@spindlecommerce/storefront-client";
import { notifyCartChanged } from "@spindlecommerce/storefront-next/client";
import { useActionState, useEffect, useMemo } from "react";
import { useMarket } from "@/components/market-provider";
import { addToCartAction, type AddToCartState } from "./cart-actions";

/** Which options product cards offer, and adding to the cart from a form. */

/** Cards offer sizes for this attribute; other options are chosen on the product page. */
const SIZE = "size";

/** A card's colours (the option with swatches) and sizes, and whether those are all its options. */
export const cardOptions = (options: ProductOption[]) => {
  const colour = options.find((o) => o.values.some((v) => v.swatch)) ?? null;
  const size = options.find((o) => o !== colour && o.attribute.code === SIZE) ?? null;
  return { colour, size, onlyColourAndSize: options.every((o) => o === colour || o === size) };
};

/** Photos of variants with this value of `attribute`, then photos of no variant. */
export const photosFor = <P extends { variantId: string | null }>(photos: P[], variants: VariantSummary[], attribute: string, value: string) => {
  const valueOf = new Map(variants.map((v) => [v.id, selectionOf(v)[attribute]]));
  const own = photos.filter((p) => p.variantId && valueOf.get(p.variantId) === value);
  const shared = photos.filter((p) => !p.variantId || !valueOf.has(p.variantId));
  return own.length || shared.length ? [...own, ...shared] : photos;
};

const IDLE: AddToCartState = { status: "idle", message: null, totalQuantity: null, key: 0 };

/** A form action adding the form's variantId (and quantity, default 1); the header's count follows. */
export const useAddToCart = () => {
  const { key: market } = useMarket().current;
  const action = useMemo(() => addToCartAction.bind(null, market), [market]);
  const result = useActionState(action, IDLE);
  const [state] = result;
  useEffect(() => {
    if (state.status === "added") notifyCartChanged();
  }, [state]);
  return result;
};
