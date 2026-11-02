import { draftAddress, emailOf, forCountry, readAddressFields, validateAddress, validateEmail, type AddressDraftInput, type AddressFields, type AddressInput } from "./checkout-address";
import type { Country } from "./checkout-types";
import type { Messages } from "./i18n/translate";

/**
 * The checkout form, for its client component and the server actions. Errors are keyed by field
 * name: email, shipping.<field>, billing.<field>, shippingMethodCode, paymentMethodCode.
 */

/** cartUpdate's input, as the storefront sends it. */
export type CartUpdateInput = {
  email?: string;
  shippingAddress?: { address: AddressDraftInput | AddressInput };
  billingAddress?: { sameAsShipping: true } | { address: AddressDraftInput | AddressInput };
  shippingMethodCode?: string | null;
  paymentMethodCode?: string;
};

export type CheckoutDetails = {
  email: string;
  /** Null when nothing in the cart ships. */
  shipping: AddressFields | null;
  /** Null while the billing address is the shipping address. */
  billing: AddressFields | null;
  shippingMethodCode: string | null;
  paymentMethodCode: string | null;
};

export type CheckoutCountries = { shipping: Country[]; billing: Country[] };

/** Messages by field name. */
export type CheckoutErrors = Record<string, string>;

const text = (form: FormData, name: string) => {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
};

export const readCheckoutDetails = (form: FormData): CheckoutDetails => {
  const ships = form.has("shipping.countryCode");
  return {
    email: text(form, "email"),
    shipping: ships ? readAddressFields(form, "shipping.") : null,
    billing: ships && form.get("billingSameAsShipping") === "on" ? null : readAddressFields(form, "billing."),
    shippingMethodCode: text(form, "shippingMethodCode") || null,
    paymentMethodCode: text(form, "paymentMethodCode") || null,
  };
};

/** The details filled in and valid so far, to save as the shopper types. */
export const draftCheckoutInput = (details: CheckoutDetails, countries: CheckoutCountries): CartUpdateInput => {
  const input: CartUpdateInput = {};
  const email = emailOf(details.email);
  if (email) input.email = email;
  const shipping = details.shipping && draftAddress(details.shipping, countries.shipping);
  if (shipping) input.shippingAddress = { address: shipping };
  if (!details.billing) input.billingAddress = { sameAsShipping: true };
  else {
    const billing = draftAddress(details.billing, countries.billing);
    if (billing) input.billingAddress = { address: billing };
  }
  return input;
};

/**
 * The input to send with the order, or each problem by field. The shipping method is not sent: the
 * cart already has one (the shopper's choice, or the cheapest).
 */
export const checkCheckoutDetails = (details: CheckoutDetails, countries: CheckoutCountries, m: Messages): { input: CartUpdateInput } | { errors: CheckoutErrors } => {
  const errors: CheckoutErrors = {};
  const input: CartUpdateInput = {};
  const email = validateEmail(details.email, m);
  if ("error" in email) errors.email = email.error;
  else input.email = email.email;
  if (details.shipping) {
    const shipping = validateAddress(details.shipping, countries.shipping, "shipping", m);
    if ("errors" in shipping) for (const [field, message] of Object.entries(shipping.errors)) errors[`shipping.${field}`] = message;
    else input.shippingAddress = { address: shipping.address };
  }
  if (!details.paymentMethodCode) errors.paymentMethodCode = m.validation.choosePayment;
  else input.paymentMethodCode = details.paymentMethodCode;
  if (!details.billing) input.billingAddress = { sameAsShipping: true };
  else {
    const billing = validateAddress(details.billing, countries.billing, "billing", m);
    if ("errors" in billing) for (const [field, message] of Object.entries(billing.errors)) errors[`billing.${field}`] = message;
    else input.billingAddress = { address: billing.address };
  }
  return Object.keys(errors).length ? { errors } : { input };
};

/** The errors of one section, by its own field names: sectionErrors(errors, "shipping").postalCode. */
export const sectionErrors = (errors: CheckoutErrors, section: "shipping" | "billing") =>
  Object.fromEntries(Object.entries(errors).flatMap(([key, message]) => (key.startsWith(`${section}.`) ? [[key.slice(section.length + 1), message]] : [])));

const requiredMessage = (m: Messages, name: string, country: string): string | undefined =>
  ({
    email: m.validation.emailRequired,
    firstName: m.validation.firstName,
    lastName: m.validation.lastName,
    line1: m.validation.line1,
    city: m.validation.city,
    postalCode: forCountry(m.address.postal.required, country),
    shippingMethodCode: m.validation.chooseShipping,
    paymentMethodCode: m.validation.choosePayment,
  })[name];

/**
 * An API error as a form field and message: ["input", "shippingAddress", "address", "postalCode"]
 * is "shipping.postalCode". The API's "Required" becomes the form's own wording.
 */
export const formError = (path: string[], message: string, details: CheckoutDetails, m: Messages): [field: string, message: string] => {
  const parts = path[0] === "input" ? path.slice(1) : path;
  const section = parts[0] === "shippingAddress" ? "shipping" : parts[0] === "billingAddress" ? "billing" : null;
  const field = section ? (parts[1] === "address" && parts[2] ? `${section}.${parts[2]}` : section) : (parts[0] ?? "");
  const name = field.split(".").pop()!;
  const address = section === "billing" ? (details.billing ?? details.shipping) : details.shipping;
  return [field, (message === "Required" && requiredMessage(m, name, address?.countryCode.toUpperCase() ?? "")) || message];
};
