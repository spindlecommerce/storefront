import "server-only";
import { storefront } from "./storefront";

export { CartError, type Cart, type CartLine } from "@spindlecommerce/storefront-client";

/** The shopper's cart; null before the first add, or once it became an order. */
export const getCart = async () => (await storefront.cart()).get();
