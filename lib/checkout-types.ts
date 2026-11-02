import type { Address, CartRequirement, Money, PaymentMethod, PlaceOrderFailure, ShippingRate } from "@spindlecommerce/storefront-client";
import type { Translator } from "./i18n/translate";

/** Checkout types and helpers shared with client components, so nothing here holds the cart id. */

export type { Address, CartRequirement, Country, PaymentMethod, PlaceOrderFailure, ShippingRate } from "@spindlecommerce/storefront-client";

export type CheckoutView = {
  /** Increments on every change to the cart. */
  version: number;
  email: string | null;
  requiresShipping: boolean;
  missing: CartRequirement[];
  /** As far as the shopper filled them in. */
  shippingAddress: Address | null;
  /** The cart's own, or else the shipping address. */
  billingAddress: Address | null;
  billingSameAsShipping: boolean;
  shippingMethods: ShippingRate[];
  /** The shopper's choice, or the cheapest rate until they choose. */
  selectedShippingCode: string | null;
  paymentMethods: PaymentMethod[];
  selectedPayment: PaymentMethod | null;
  total: Money | null;
};

// ---------------------------------------------------------------- action results

/** The result of a small form (the discount code). */
export type FormState = {
  status: "idle" | "saved" | "error";
  /** What went wrong that is not about one field. */
  message: string | null;
  /** Messages by field name. */
  errors: Record<string, string>;
  /** What was submitted, to show it again after an error. */
  values: Record<string, string>;
  /** Changes with every submission, so the form reacts to the same error twice. */
  key: number;
};

export const IDLE_FORM: FormState = { status: "idle", message: null, errors: {}, values: {}, key: 0 };

/** Saving the form as the shopper types. Errors are by field ("shipping.postalCode"). */
export type SaveResult = { ok: true } | { ok: false; message: string | null; errors: Record<string, string> };

/** `errors` are by field ("shipping.postalCode"), shown next to the fields; `message` is the rest. */
export type PlaceOrderState = { status: "idle" | "error"; reason: PlaceOrderFailure | null; message: string | null; errors: Record<string, string>; key: number };

export const IDLE_PLACE_ORDER: PlaceOrderState = { status: "idle", reason: null, message: null, errors: {}, key: 0 };

/** For providers with their own payment form. Stripe's clientData has the client secret. */
export type PaymentSessionResult =
  | { ok: true; provider: string; clientData: Record<string, unknown>; amount: Money | null }
  | { ok: false; message: string };

// ---------------------------------------------------------------- payment providers

/** The test_gateway provider's tokens. `text` keys m.payment.testCards. */
export const TEST_TOKENS = [
  { token: "tok_visa", text: "visa" },
  { token: "tok_declined", text: "declined" },
  { token: "tok_insufficient_funds", text: "insufficientFunds" },
] as const;

export type PaymentKind = "test_gateway" | "stripe" | "offline" | "other" | "unsupported";

/**
 * test_gateway: choose a test token. stripe: the Payment Element. offline: nothing to enter. Other
 * providers work only without a payment session; with one, they need a form this storefront lacks.
 */
export const paymentKind = (method: Pick<PaymentMethod, "provider" | "sessionRequired">): PaymentKind => {
  if (method.provider === "test_gateway") return "test_gateway";
  if (method.provider === "stripe") return "stripe";
  if (method.provider === "offline") return "offline";
  return method.sessionRequired ? "unsupported" : "other";
};

// ---------------------------------------------------------------- formatting

const FIELDS = ["firstName", "lastName", "company", "line1", "line2", "city", "region", "regionCode", "postalCode", "countryCode", "phone"] as const;

export const sameAddress = (a: Address | null, b: Address | null) => !!a && !!b && FIELDS.every((field) => (a[field] ?? "") === (b[field] ?? ""));

/** Countries whose addresses put the postal code before the city: "10115 Berlin". */
const POSTAL_CODE_FIRST = new Set(["AT", "BE", "CH", "CZ", "DE", "DK", "ES", "FI", "FR", "IT", "LU", "NL", "NO", "PL", "PT", "SE"]);

/** An address as lines of text, in the country's usual order. */
export const addressLines = (address: Address, countryName?: (code: string) => string | undefined) => {
  const name = [address.firstName, address.lastName].filter(Boolean).join(" ");
  const region = address.regionCode || address.region;
  const code = address.countryCode ?? "";
  const cityLines = POSTAL_CODE_FIRST.has(code)
    ? [[address.postalCode, address.city].filter(Boolean).join(" ")]
    : code === "GB"
      ? [address.city, address.postalCode]
      : [[address.city, [region, address.postalCode].filter(Boolean).join(" ")].filter(Boolean).join(", ")];
  const country = address.countryCode ? (countryName?.(address.countryCode) ?? address.countryCode) : null;
  return [name, address.company, address.line1, address.line2, ...cityLines, country, address.phone].filter((line): line is string => !!line);
};

/** "Arrives in 1–2 days", "Arrives in 5 days" or null. */
export const deliveryEstimate = (rate: Pick<ShippingRate, "minDeliveryDays" | "maxDeliveryDays">, t: Translator) => {
  const { minDeliveryDays: min, maxDeliveryDays: max } = rate;
  if (min == null && max == null) return null;
  if (min != null && max != null && min !== max) return t.f(t.m.checkout.arrivesBetween, { min, max });
  return t.p(t.m.checkout.arrivesIn, (max ?? min)!);
};

export const isZero = (money: Money | null | undefined) => !money || Number(money.amount) === 0;
