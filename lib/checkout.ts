import "server-only";
import type { CartChange as ApiCartChange, CheckoutCart, FieldError, PlacedOrderRef } from "@spindlecommerce/storefront-client";
import { cookies } from "next/headers";
import { cache } from "react";
import { ISO_COUNTRY_CODES } from "./checkout-address";
import type { CartUpdateInput } from "./checkout-details";
import type { CheckoutView, Country, PaymentSessionResult, PlaceOrderFailure } from "./checkout-types";
import { couponReason } from "./coupons";
import type { Translator } from "./i18n";
import { getT, localized } from "./market";
import { storefront } from "./storefront";

/**
 * Checkout over the Storefront API, with its results in the shopper's language. The cart id stays
 * server-side, in an httpOnly cookie.
 */

export type { CheckoutCart, CheckoutLine, Discount, FieldError, PlacedOrder } from "@spindlecommerce/storefront-client";

const checkout = async () => (await storefront.cart()).checkout;

// ---------------------------------------------------------------- reads

export const loadCheckoutCart = async () => (await checkout()).get();

export const getCheckoutCart = cache(loadCheckoutCart);

/** For client components: no cart id, no line details. */
export const checkoutView = (cart: CheckoutCart): CheckoutView => ({
  version: cart.version,
  email: cart.email,
  requiresShipping: cart.requiresShipping,
  missing: cart.missing,
  shippingAddress: cart.shippingAddress,
  billingAddress: cart.billingAddress,
  billingSameAsShipping: cart.billingSameAsShipping,
  shippingMethods: cart.shippingMethods,
  selectedShippingCode: cart.selectedShipping?.code ?? null,
  paymentMethods: cart.paymentMethods,
  selectedPayment: cart.selectedPayment,
  total: cart.cost?.total ?? null,
});

const displayNames = (locale: string) => {
  try {
    const names = new Intl.DisplayNames([locale, "en"], { type: "region" });
    return (code: string) => names.of(code) ?? code;
  } catch {
    return (code: string) => code;
  }
};

/**
 * Shipping goes to the channel's countries only; billing addresses may be anywhere. Read like the
 * cart, without the preview token, so checkout works even after a preview expires.
 */
export const getCheckoutCountries = cache(async (): Promise<{ shipping: Country[]; billing: Country[] }> => {
  const { locale: given, countries: shipping } = await (await storefront.privateClient()).countries();
  const locale = given ?? "en-US";
  const nameOf = displayNames(locale);
  const billing = ISO_COUNTRY_CODES.map((code) => ({ code, name: shipping.find((c) => c.code === code)?.name ?? nameOf(code) })).sort((a, b) => a.name.localeCompare(b.name, locale));
  return { shipping, billing };
});

// ---------------------------------------------------------------- saving details

/** "invalid": fix the input. "expired" or "closed": the cart is gone. */
export type CartChange = { ok: true } | { ok: false; reason: "invalid" | "expired" | "closed" | "error"; message: string; fieldErrors: FieldError[] };

const sentence = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  const capitalized = trimmed[0]!.toUpperCase() + trimmed.slice(1);
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
};

/** "Required" stays as is: the form has its own wording for it (formError). */
const shopperFieldErrors = (errors: FieldError[]) => errors.map((e) => ({ path: e.path, message: e.message === "Required" ? e.message : sentence(e.message) }));

const toChange = (change: ApiCartChange, { m, f }: Translator): CartChange => {
  if (change.ok) return change;
  switch (change.reason) {
    case "invalid":
      if (change.type === "CouponNotApplicableError") return { ok: false, reason: "invalid", message: f(m.coupon.cannotUse, { reason: couponReason(change.couponReason, m) }), fieldErrors: [] };
      return { ok: false, reason: "invalid", message: sentence(change.message ?? m.checkoutErrors.checkDetails), fieldErrors: shopperFieldErrors(change.fieldErrors) };
    case "expired":
      return { ok: false, reason: "expired", message: m.checkoutErrors.expired, fieldErrors: [] };
    case "closed":
      return { ok: false, reason: "closed", message: m.checkoutErrors.closed, fieldErrors: [] };
    default:
      return { ok: false, reason: "error", message: m.checkoutErrors.generic, fieldErrors: [] };
  }
};

/** Saves any of the shopper's details, complete or not. */
export const updateCart = async (input: CartUpdateInput) => toChange(await (await checkout()).update(input), await getT());
export const applyCoupon = async (code: string) => toChange(await (await checkout()).applyCoupon(code), await getT());
export const removeCoupon = async (code: string) => toChange(await (await checkout()).removeCoupon(code), await getT());

// ---------------------------------------------------------------- payment sessions

/**
 * Starts the payment session, or updates it after the total changed. For Stripe, a PaymentIntent
 * whose client secret and publishable key the Payment Element needs.
 */
export const createPaymentSession = async (): Promise<PaymentSessionResult> => {
  const { m } = await getT();
  const result = await (await checkout()).createPaymentSession();
  if (result.ok) return { ok: true, provider: result.session.provider, clientData: result.session.clientData, amount: result.session.amount };
  if (result.reason === "expired") return { ok: false, message: m.checkoutErrors.expired };
  if (result.reason === "not_ready") return { ok: false, message: m.checkoutErrors.notReadyForPayment };
  // The cart became an order, or the provider refused (the message says why).
  return { ok: false, message: sentence(result.message ?? m.checkoutErrors.paymentNotPrepared) };
};

// ---------------------------------------------------------------- placing the order

export type PlaceOrderResult = { ok: true; number: string } | { ok: false; reason: PlaceOrderFailure; message: string; fieldErrors?: FieldError[] };

const PLACED_COOKIE = "spindle_order";
/** The cookie's path: only the confirmation pages read it. */
const PLACED_PATH = "/checkout/confirmation";

/** guestOrder needs the first three; the cart has the payment instructions. */
type PlacedOrderCookie = { number: string; email: string; postalCode: string; cartId: string };

/** Remembers the order for its confirmation page: one hour, this browser. */
const rememberOrder = async (order: PlacedOrderRef, cartId: string) => {
  const value: PlacedOrderCookie = { number: order.number, email: order.email, postalCode: order.billingAddress?.postalCode ?? "", cartId };
  (await cookies()).set(PLACED_COOKIE, JSON.stringify(value), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: await localized(PLACED_PATH), maxAge: 60 * 60 });
};

/**
 * Saves `input` and places the order in one call; the next add starts a new cart. Retrying with the
 * same idempotency key returns the same order instead of placing another.
 */
export const placeOrder = async (idempotencyKey: string, payment: { token?: string }, input?: CartUpdateInput): Promise<PlaceOrderResult> => {
  const t = await getT();
  const { m } = t;
  const result = await (await checkout()).placeOrder({ idempotencyKey, payment, input });
  if (result.ok) {
    await rememberOrder(result.order, result.cartId);
    return { ok: true, number: result.order.number };
  }
  switch (result.reason) {
    case "declined":
      return { ok: false, reason: "declined", message: m.checkoutErrors.declined };
    case "not_ready": {
      const missing = result.missing.map((need) => (m.checkoutErrors.needs as Record<string, string | undefined>)[need] ?? need.toLowerCase());
      return { ok: false, reason: "not_ready", message: missing.length ? t.f(m.checkoutErrors.stillNeeds, { items: t.list(missing) }) : m.checkoutErrors.notReady, fieldErrors: shopperFieldErrors(result.fieldErrors) };
    }
    case "stock":
      // The cart page says which items, and how many are left.
      return { ok: false, reason: "stock", message: m.checkoutErrors.stock };
    case "closed":
      return { ok: false, reason: "closed", message: m.checkoutErrors.closed };
    case "expired":
      return { ok: false, reason: "expired", message: m.checkoutErrors.expired };
    case "invalid": {
      // Invalid details or a plugin's checkout rule. One issue repeats as message and field error.
      const details = result.fieldErrors.map((e) => sentence(e.message));
      return { ok: false, reason: "invalid", message: [...new Set([sentence(result.message ?? m.checkoutErrors.notPlaced), ...details])].join(" "), fieldErrors: shopperFieldErrors(result.fieldErrors) };
    }
    default:
      return { ok: false, reason: "error", message: m.checkoutErrors.notPlaced };
  }
};

// ---------------------------------------------------------------- the confirmation page

const readPlacedOrderCookie = async (): Promise<PlacedOrderCookie | null> => {
  const raw = (await cookies()).get(PLACED_COOKIE)?.value;
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<PlacedOrderCookie>;
    const fields = [value.number, value.email, value.postalCode, value.cartId];
    return fields.every((f) => typeof f === "string" && f) ? (value as PlacedOrderCookie) : null;
  } catch {
    return null;
  }
};

/** The order with this number if this browser placed it in the last hour, otherwise null. */
export const getPlacedOrder = async (number: string) => {
  const placed = await readPlacedOrderCookie();
  if (!placed || placed.number !== number) return null;
  return (await storefront.privateClient()).guestOrder({ email: placed.email, number: placed.number, postalCode: placed.postalCode, cartId: placed.cartId });
};
