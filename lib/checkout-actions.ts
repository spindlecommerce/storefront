"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { applyCoupon, createPaymentSession, getCheckoutCountries, placeOrder, removeCoupon, updateCart, type CartChange, type FieldError, type PlaceOrderResult } from "./checkout";
import { checkCheckoutDetails, draftCheckoutInput, formError, readCheckoutDetails, type CartUpdateInput, type CheckoutErrors } from "./checkout-details";
import type { FormState, PaymentSessionResult, PlaceOrderState, SaveResult } from "./checkout-types";
import type { Messages } from "./i18n";
import { getT, inMarket, localized } from "./market";

/**
 * Checkout's server actions. Input is checked here, never trusted from the client. Each takes the
 * calling page's market first: Server Actions cannot read the route's.
 */

/** Text fields only, to refill the form after an error. */
const submitted = (form: FormData) => Object.fromEntries([...form.entries()].flatMap(([name, value]) => (typeof value === "string" && !name.startsWith("$ACTION") ? [[name, value]] : [])));

const failed = (form: FormData, message: string | null, errors: Record<string, string> = {}): FormState => ({ status: "error", message, errors, values: submitted(form), key: Date.now() });

/** The first message for a field wins. */
const byField = (fieldErrors: FieldError[], form: FormData, m: Messages): CheckoutErrors => {
  const details = readCheckoutDetails(form);
  const errors: CheckoutErrors = {};
  for (const error of fieldErrors) {
    const [field, message] = formError(error.path, error.message, details, m);
    errors[field] ??= message;
  }
  return errors;
};

/** A cart that is gone or already an order refreshes the page, which then says so. */
const saved = (change: CartChange, form: FormData, m: Messages): SaveResult => {
  if (change.ok) {
    refresh();
    return { ok: true };
  }
  if (change.reason === "expired" || change.reason === "closed") refresh();
  const errors = byField(change.fieldErrors, form, m);
  // "The input is invalid" adds nothing to errors shown next to their fields.
  return { ok: false, message: Object.keys(errors).length ? null : change.message, errors };
};

const countries = async () => {
  try {
    return await getCheckoutCountries();
  } catch (error) {
    console.error("Could not load the countries", error);
    return null;
  }
};

/**
 * Saves the form as the shopper types. Fields: "save.details" (the valid details so far),
 * "save.shippingMethodCode" (empty: the cheapest rate) and "save.paymentMethodCode".
 */
export async function saveCheckoutAction(market: string, form: FormData): Promise<SaveResult> {
  return inMarket(market, () => saveCheckout(form));
}

const saveCheckout = async (form: FormData): Promise<SaveResult> => {
  const { m } = await getT();
  const known = await countries();
  if (!known) return { ok: false, message: m.checkoutErrors.unexpected, errors: {} };
  const details = readCheckoutDetails(form);
  const input: CartUpdateInput = form.get("save.details") ? draftCheckoutInput(details, known) : {};
  const shippingMethod = form.get("save.shippingMethodCode");
  if (typeof shippingMethod === "string") input.shippingMethodCode = shippingMethod || null;
  const paymentMethod = form.get("save.paymentMethodCode");
  if (typeof paymentMethod === "string" && paymentMethod) input.paymentMethodCode = paymentMethod;
  if (!Object.keys(input).length) return { ok: true };
  try {
    return saved(await updateCart(input), form, m);
  } catch (error) {
    console.error("Saving checkout details failed", error);
    return { ok: false, message: m.checkoutErrors.unexpected, errors: {} };
  }
};

export async function applyCouponAction(market: string, _previous: FormState, form: FormData): Promise<FormState> {
  return inMarket(market, () => applyCouponIn(form));
}

const applyCouponIn = async (form: FormData): Promise<FormState> => {
  const { m, f } = await getT();
  const code = String(form.get("code") ?? "").trim();
  if (!code) return failed(form, null, { code: m.validation.codeRequired });
  if (code.length > 64) return failed(form, null, { code: f(m.validation.codeTooLong, { limit: 64 }) });
  let change: CartChange;
  try {
    change = await applyCoupon(code);
  } catch (error) {
    console.error("Applying a discount code failed", error);
    return failed(form, m.checkoutErrors.unexpected);
  }
  const result = saved(change, form, m);
  // Why a code does not apply belongs next to the code field.
  return result.ok
    ? { status: "saved", message: null, errors: {}, values: {}, key: Date.now() }
    : failed(form, null, { code: result.message ?? Object.values(result.errors)[0] ?? m.checkoutErrors.unexpected });
};

export async function removeCouponAction(market: string, form: FormData): Promise<void> {
  return inMarket(market, () => removeCouponIn(form));
}

const removeCouponIn = async (form: FormData): Promise<void> => {
  const code = form.get("code");
  if (typeof code !== "string" || !code) return;
  try {
    const result = await removeCoupon(code);
    if (!result.ok) console.error("Could not remove the coupon", result.message);
  } catch (error) {
    console.error("Could not remove the coupon", error);
  }
  refresh();
};

export async function createPaymentSessionAction(market: string): Promise<PaymentSessionResult> {
  return inMarket(market, async () => {
    try {
      return await createPaymentSession();
    } catch (error) {
      console.error("Could not create a payment session", error);
      return { ok: false, message: (await getT()).m.checkoutErrors.paymentFormUnavailable };
    }
  });
}

/** Checks every detail as the API would. Null when the countries could not be loaded. */
const checkForm = async (form: FormData, m: Messages): Promise<{ input: CartUpdateInput } | { errors: CheckoutErrors } | null> => {
  const known = await countries();
  return known && checkCheckoutDetails(readCheckoutDetails(form), known, m);
};

/**
 * Before a payment confirmed in the browser (Stripe): saves every detail and updates the payment
 * session to the final total, so the shopper pays exactly what the order costs.
 */
export async function prepareOrderAction(market: string, form: FormData): Promise<SaveResult> {
  return inMarket(market, () => prepareOrder(form));
}

const prepareOrder = async (form: FormData): Promise<SaveResult> => {
  const { m } = await getT();
  const checked = await checkForm(form, m);
  if (!checked) return { ok: false, message: m.checkoutErrors.unexpected, errors: {} };
  if ("errors" in checked) return { ok: false, message: null, errors: checked.errors };
  try {
    const change = await updateCart(checked.input);
    if (!change.ok) return saved(change, form, m);
    const session = await createPaymentSession();
    return session.ok ? { ok: true } : { ok: false, message: session.message, errors: {} };
  } catch (error) {
    console.error("Preparing the order failed", error);
    return { ok: false, message: m.checkoutErrors.unexpected, errors: {} };
  }
};

/**
 * Extra fields: idempotencyKey (one per attempt, so a double submit returns the same order), token
 * for the test gateway, and "paid" after a browser-confirmed payment, when prepareOrderAction has
 * already saved the details.
 */
export async function placeOrderAction(market: string, _previous: PlaceOrderState, form: FormData): Promise<PlaceOrderState> {
  return inMarket(market, () => placeOrderIn(form));
}

const placeOrderIn = async (form: FormData): Promise<PlaceOrderState> => {
  const { m } = await getT();
  const fail = (reason: PlaceOrderState["reason"], message: string | null, errors: CheckoutErrors = {}): PlaceOrderState => ({ status: "error", reason, message, errors, key: Date.now() });
  const key = form.get("idempotencyKey");
  const token = form.get("token");
  if (typeof key !== "string" || !/^[A-Za-z0-9_-]{8,200}$/.test(key)) return fail("invalid", m.checkoutErrors.unexpected);
  const payment = typeof token === "string" && /^[A-Za-z0-9_]{1,100}$/.test(token) ? { token } : {};

  let input: CartUpdateInput | undefined;
  if (form.get("paid") !== "1") {
    const checked = await checkForm(form, m);
    if (!checked) return fail("error", m.checkoutErrors.unexpected);
    if ("errors" in checked) return fail("invalid", null, checked.errors);
    input = checked.input;
  }

  let result: PlaceOrderResult;
  try {
    result = await placeOrder(key, payment, input);
  } catch (error) {
    console.error("Placing the order failed", error);
    return fail("error", m.checkoutErrors.notConfirmed);
  }
  if (result.ok) redirect(await localized(`/checkout/confirmation/${encodeURIComponent(result.number)}`));
  // What the order still needs (or that the cart is gone) shows on the refreshed page.
  if (result.reason === "not_ready" || result.reason === "stock" || result.reason === "closed" || result.reason === "expired") refresh();
  const errors = byField(result.fieldErrors ?? [], form, m);
  return fail(result.reason, Object.keys(errors).length && (result.reason === "not_ready" || result.reason === "invalid") ? null : result.message, errors);
};
