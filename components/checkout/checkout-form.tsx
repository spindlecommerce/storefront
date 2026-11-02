"use client";

import { CircleAlert, Lock } from "lucide-react";
import Link from "@/components/ui/link";
import {
  createContext,
  startTransition,
  useActionState,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { useMarket, useT } from "@/components/market-provider";
import { buttonClass } from "@/components/ui/button";
import { placeOrderAction, prepareOrderAction, saveCheckoutAction } from "@/lib/checkout-actions";
import { checkCheckoutDetails, readCheckoutDetails, sectionErrors, type CheckoutCountries, type CheckoutErrors } from "@/lib/checkout-details";
import { deliveryEstimate, IDLE_PLACE_ORDER, isZero, paymentKind, type CheckoutView, type SaveResult } from "@/lib/checkout-types";
import { cx } from "@/lib/cx";
import type { Messages } from "@/lib/i18n/translate";
import { AddressFields } from "./address-fields";
import { FieldError, fieldId, RadioCard, Spinner, TextField } from "./fields";
import { Notice } from "./notice";
import { PaymentDetails, TestModeBadge } from "./payment-details";
import type { StripeHandle } from "./stripe-payment";

// ---------------------------------------------------------------- saving status

const Saving = createContext<{ saving: boolean; setSaving: (saving: boolean) => void }>({ saving: false, setSaving: () => {} });

/** Wraps the form and the summary, so the summary can show its totals are updating. */
export function CheckoutStatus({ children }: { children: ReactNode }) {
  const [saving, setSaving] = useState(false);
  const value = useMemo(() => ({ saving, setSaving }), [saving]);
  return <Saving value={value}>{children}</Saving>;
}

/** Fades the summary while the last change is saved and priced. */
export function SummaryStatus({ children }: { children: ReactNode }) {
  const { saving } = useContext(Saving);
  return (
    <div aria-busy={saving} className={cx("transition-opacity duration-200", saving && "opacity-50")}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------- saving as the shopper types

const fieldName = (target: EventTarget) => (target instanceof HTMLInputElement || target instanceof HTMLSelectElement ? target.name : "");

/** Fields saved as the shopper types; the methods are saved when chosen. */
const isDetail = (name: string) => name === "email" || name === "billingSameAsShipping" || name.startsWith("shipping.") || name.startsWith("billing.");

type Pending = { details: boolean; shippingMethodCode?: string; paymentMethodCode?: string };

/**
 * Saves details when the shopper pauses or leaves a field, and a chosen method at once. One save
 * runs at a time; changes made meanwhile go in the next.
 */
function useAutosave(formRef: RefObject<HTMLFormElement | null>, onSaved: (result: SaveResult, sent: Pending) => void) {
  const { key: market } = useMarket().current;
  const { m } = useT();
  const [saving, startSaving] = useTransition();
  const pending = useRef<Pending>({ details: false });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const running = useRef<Promise<void> | null>(null);
  const lastDetails = useRef<string | null>(null);
  const saved = useRef(onSaved);
  useEffect(() => {
    saved.current = onSaved;
  });

  const drain = useCallback(async () => {
    for (;;) {
      const next = pending.current;
      pending.current = { details: false };
      if (!formRef.current) return;
      const data = new FormData(formRef.current);
      // Details are sent again only when they changed.
      const signature = JSON.stringify([...data.entries()].filter(([name]) => isDetail(name)));
      const details = next.details && signature !== lastDetails.current;
      if (!details && next.shippingMethodCode === undefined && next.paymentMethodCode === undefined) return;
      if (details) data.set("save.details", "1");
      if (next.shippingMethodCode !== undefined) data.set("save.shippingMethodCode", next.shippingMethodCode);
      if (next.paymentMethodCode !== undefined) data.set("save.paymentMethodCode", next.paymentMethodCode);
      let result: SaveResult;
      try {
        result = await saveCheckoutAction(market, data);
      } catch {
        result = { ok: false, message: m.checkout.notSaved, errors: {} };
      }
      if (result.ok && details) lastDetails.current = signature;
      saved.current(result, next);
    }
  }, [formRef, market, m]);

  /** Save what is waiting now; resolves once nothing is. */
  const flush = useCallback(() => {
    clearTimeout(timer.current);
    running.current ??= new Promise<void>((resolve) => {
      startSaving(async () => {
        try {
          await drain();
        } finally {
          running.current = null;
          resolve();
        }
      });
    });
    return running.current;
  }, [drain]);

  const schedule = useCallback(
    (delay = 700) => {
      pending.current.details = true;
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, delay);
    },
    [flush],
  );

  const choose = useCallback(
    (piece: Omit<Pending, "details">) => {
      Object.assign(pending.current, piece);
      return flush();
    },
    [flush],
  );

  useEffect(() => () => clearTimeout(timer.current), []);
  return { saving, schedule, choose, flush, isPending: () => pending.current.details };
}

// ---------------------------------------------------------------- the form

/** crypto.randomUUID needs a secure context; getRandomValues does not. */
const newAttemptKey = () => {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
};

/** The element id an error in the list links to. */
const anchorFor = (field: string) => {
  if (field === "email") return fieldId("contact", "email");
  if (field === "shippingMethodCode") return "shipping-methods";
  if (field === "paymentMethodCode") return "payment-methods";
  const [section, name] = field.split(".");
  return name && (section === "shipping" || section === "billing") ? fieldId(section, name) : null;
};

/** Drops a field's errors, or a whole section's ("billing."). */
const without = (errors: CheckoutErrors, field: string) => Object.fromEntries(Object.entries(errors).filter(([key]) => (field.endsWith(".") ? !key.startsWith(field) : key !== field)));

const sectionLabel = (field: string, m: Messages) => ({ shipping: m.checkout.delivery, billing: m.checkout.billingAddress })[field.split(".")[0]!];

const problemsIn = (form: HTMLFormElement, countries: CheckoutCountries, m: Messages): CheckoutErrors => {
  const checked = checkCheckoutDetails(readCheckoutDetails(new FormData(form)), countries, m);
  return "errors" in checked ? checked.errors : {};
};

function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`${id}-title`} className="rounded-3xl bg-white p-5 ring-1 ring-line sm:p-6">
      <h2 id={`${id}-title`} className="text-lg font-semibold">
        {title}
      </h2>
      {description && <p className="mt-1 text-sm text-stone-500">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

type Choice = { code: string; version: number };

/**
 * One form, one button. Details save as the shopper types (cartUpdate takes incomplete addresses);
 * paying checks everything and places the order with all the details in one call.
 */
export function CheckoutForm({ view, countries }: { view: CheckoutView; countries: CheckoutCountries }) {
  const t = useT();
  const { m } = t;
  const formRef = useRef<HTMLFormElement>(null);
  const { setSaving } = useContext(Saving);
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [focusErrors, setFocusErrors] = useState(0);
  // Once the shopper tried to pay, every problem shows; before, only those in what they typed.
  const [attempted, setAttempted] = useState(false);
  const [sameAsShipping, setSameAsShipping] = useState(view.billingSameAsShipping);
  // A newly chosen method, shown until the save refreshes the page and the cart's version changes.
  const [shippingChoice, setShippingChoice] = useState<Choice | null>(null);
  const [paymentChoice, setPaymentChoice] = useState<Choice | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const onSaved = useCallback((result: SaveResult, sent: Pending) => {
    if (result.ok) return setMessage(null);
    if (sent.shippingMethodCode !== undefined) setShippingChoice(null);
    if (sent.paymentMethodCode !== undefined) setPaymentChoice(null);
    setErrors((current) => ({ ...current, ...result.errors }));
    setMessage(result.message);
  }, []);
  const autosave = useAutosave(formRef, onSaved);
  useEffect(() => setSaving(autosave.saving), [autosave.saving, setSaving]);

  const usable = view.paymentMethods.filter((m) => paymentKind(m) !== "unsupported");
  const chosenShipping = shippingChoice?.version === view.version ? shippingChoice.code : view.selectedShippingCode;
  // Until the cart has one, preselect the first payment method the store can take.
  const firstUsable = usable[0]?.code ?? null;
  const chosenPayment = (paymentChoice?.version === view.version ? paymentChoice.code : view.selectedPayment?.code) ?? firstUsable;
  const method = view.paymentMethods.find((m) => m.code === chosenPayment) ?? null;
  const kind = method ? paymentKind(method) : null;

  // Save that first method, so a form it needs (a payment session) can load.
  const { choose } = autosave;
  const preselected = useRef(false);
  useEffect(() => {
    if (preselected.current || view.selectedPayment || !firstUsable) return;
    preselected.current = true;
    void choose({ paymentMethodCode: firstUsable });
  }, [view.selectedPayment, firstUsable, choose]);

  const { key: market } = useMarket().current;
  const placeOrder = useMemo(() => placeOrderAction.bind(null, market), [market]);
  const [state, dispatch, placing] = useActionState(placeOrder, IDLE_PLACE_ORDER);
  const [preparing, setPreparing] = useState(false);
  const [stripe, setStripe] = useState<StripeHandle | null>(null);
  const attempt = useRef<string | null>(null);
  const busy = placing || preparing;

  // The order was not placed: show why, next to the fields at fault.
  const [shownState, setShownState] = useState(state);
  if (state !== shownState) {
    setShownState(state);
    if (state.status === "error") {
      setErrors(state.errors);
      setMessage(state.message);
      setFocusErrors((n) => n + 1);
    }
  }
  // A definite failure ends the attempt. After an unknown outcome, a retry reuses its key.
  useEffect(() => {
    if (state.status === "error" && state.reason !== "error") attempt.current = null;
  }, [state]);

  const alertRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!focusErrors) return;
    const invalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid]');
    (invalid ?? alertRef.current)?.focus();
  }, [focusErrors]);

  /** Leaving a field checks it; typing only clears a problem once it is fixed. */
  const recheck = (name: string, leaving: boolean) => {
    const form = formRef.current;
    if (!form) return;
    const problems = problemsIn(form, countries, m);
    const value = new FormData(form).get(name);
    setErrors((current) => {
      const next = { ...current };
      if (!problems[name]) delete next[name];
      // Before an attempt to pay, empty fields are not flagged.
      else if (leaving && (attempted || (typeof value === "string" && value.trim()))) next[name] = problems[name];
      return next;
    });
  };

  const chooseShipping = (code: string) => {
    setShippingChoice({ code, version: view.version });
    setErrors((current) => without(current, "shippingMethodCode"));
    void autosave.choose({ shippingMethodCode: code });
  };

  const choosePayment = (code: string) => {
    setPaymentChoice({ code, version: view.version });
    setErrors((current) => without(current, "paymentMethodCode"));
    void autosave.choose({ paymentMethodCode: code });
  };

  const pay = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (busy) return;
    setAttempted(true);
    setMessage(null);
    const problems = problemsIn(form, countries, m);
    setErrors(problems);
    if (Object.keys(problems).length) return setFocusErrors((n) => n + 1);
    attempt.current ??= newAttemptKey();
    const data = new FormData(form);
    data.set("idempotencyKey", attempt.current);

    setPreparing(true);
    try {
      if (kind === "stripe") {
        if (!stripe) return;
        // First, while the click still counts as a user gesture: wallets open their sheet here.
        const submitted = await stripe.submit();
        if (!submitted.ok) return setMessage(submitted.message);
        await autosave.flush();
        const prepared = await prepareOrderAction(market, data);
        if (!prepared.ok) {
          setErrors(prepared.errors);
          setMessage(prepared.message);
          return setFocusErrors((n) => n + 1);
        }
        const confirmed = await stripe.confirm();
        if (!confirmed.ok) {
          setMessage(confirmed.message);
          return setFocusErrors((n) => n + 1);
        }
        data.set("paid", "1");
      } else {
        await autosave.flush();
      }
    } finally {
      setPreparing(false);
    }
    startTransition(() => dispatch(data));
  };

  const rates = view.shippingMethods;
  const lineIssues = view.missing.includes("LINE_ISSUES");
  const errorList = Object.entries(errors);
  const payLabel = kind === "offline" || kind === "other" ? m.checkout.completeOrder : m.checkout.payNow;
  const ready = !!method && kind !== "unsupported" && (kind !== "stripe" || !!stripe);
  const billingInitial = view.billingSameAsShipping ? { countryCode: view.shippingAddress?.countryCode ?? null } : view.billingAddress;

  return (
    <form
      ref={formRef}
      noValidate
      // Before hydration (or without JavaScript) the form posts to the place order action, so the
      // details never go into the address bar.
      action={dispatch}
      onSubmit={pay}
      onInput={(e) => {
        const name = fieldName(e.target);
        if (!isDetail(name)) return;
        autosave.schedule();
        if (errors[name]) recheck(name, false);
      }}
      onBlur={(e) => {
        const name = fieldName(e.target);
        if (!isDetail(name)) return;
        if (autosave.isPending()) void autosave.flush();
        recheck(name, true);
      }}
      className="space-y-4"
    >
      {/* Replaced by the attempt's own key when the page is interactive. */}
      <input type="hidden" name="idempotencyKey" value={`checkout-${view.version}`} />
      <Section id="contact" title={m.checkout.contact}>
        <TextField
          form="contact"
          name="email"
          type="email"
          label={m.checkout.email}
          hint={m.checkout.emailHint}
          error={errors.email}
          defaultValue={view.email ?? ""}
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={254}
        />
      </Section>

      {view.requiresShipping && (
        <Section id="delivery" title={m.checkout.delivery}>
          {countries.shipping.length ? (
            <AddressFields section="shipping" countries={countries.shipping} initial={view.shippingAddress} errors={sectionErrors(errors, "shipping")} />
          ) : (
            <Notice tone="problem">{m.checkout.noShippingCountries}</Notice>
          )}
        </Section>
      )}

      {view.requiresShipping && (
        <Section id="shipping-method" title={m.checkout.shippingMethod}>
          <fieldset id="shipping-methods" tabIndex={-1} className="outline-none">
            <legend className="sr-only">{m.checkout.shippingMethod}</legend>
            {rates.length ? (
              <div className="space-y-3">
                {rates.map((rate) => {
                  const estimate = deliveryEstimate(rate, t);
                  return (
                    <RadioCard
                      key={rate.code}
                      name="shippingMethodCode"
                      value={rate.code}
                      checked={chosenShipping === rate.code}
                      onChange={chooseShipping}
                      invalid={!!errors.shippingMethodCode}
                      errorFor="shipping-methods-error"
                    >
                      <span className="flex items-start justify-between gap-4">
                        <span className="min-w-0">
                          <span className="block font-medium">{rate.name}</span>
                          {estimate && <span className="block text-sm text-stone-500">{estimate}</span>}
                          {rate.description && <span className="block text-sm text-stone-500">{rate.description}</span>}
                        </span>
                        <span className="shrink-0 font-medium tabular-nums">{isZero(rate.price) ? m.checkout.free : rate.price?.formatted}</span>
                      </span>
                    </RadioCard>
                  );
                })}
              </div>
            ) : view.shippingAddress?.postalCode ? (
              <Notice tone="problem" title={m.checkout.noShippingOptions}>
                <p>{m.checkout.cannotShip}</p>
              </Notice>
            ) : (
              <p className="rounded-2xl bg-stone-100 p-4 text-sm text-stone-600">{m.checkout.enterAddressForRates}</p>
            )}
            <FieldError id="shipping-methods-error" message={errors.shippingMethodCode} />
          </fieldset>
        </Section>
      )}

      <Section id="payment" title={m.checkout.payment} description={m.checkout.paymentSecure}>
        {view.paymentMethods.length ? (
          <fieldset id="payment-methods" tabIndex={-1} className="outline-none">
            <legend className="sr-only">{m.checkout.paymentMethod}</legend>
            <div className="space-y-3">
              {view.paymentMethods.map((option) => {
                const mKind = paymentKind(option);
                return (
                  <RadioCard
                    key={option.code}
                    name="paymentMethodCode"
                    value={option.code}
                    checked={chosenPayment === option.code}
                    onChange={choosePayment}
                    disabled={mKind === "unsupported"}
                    invalid={!!errors.paymentMethodCode}
                    errorFor="payment-methods-error"
                    details={
                      <PaymentDetails
                        kind={mKind}
                        method={option}
                        view={view}
                        ready={view.selectedPayment?.code === option.code}
                        onStripe={setStripe}
                        renew={state.status === "error" ? state.key : 0}
                      />
                    }
                  >
                    <span className="flex flex-wrap items-center gap-2 font-medium">
                      {option.name}
                      {mKind === "test_gateway" && <TestModeBadge />}
                    </span>
                    {mKind === "unsupported" && <span className="mt-1 block text-sm text-stone-500">{m.checkout.methodUnsupported}</span>}
                  </RadioCard>
                );
              })}
            </div>
            <FieldError id="payment-methods-error" message={errors.paymentMethodCode} />
          </fieldset>
        ) : (
          <Notice tone="problem" title={m.checkout.noPaymentMethods}>
            <p>{m.checkout.noPaymentMethodsText}</p>
          </Notice>
        )}

        <div className="mt-6 border-t border-line pt-6">
          <h3 className="font-semibold">{m.checkout.billingAddress}</h3>
          {view.requiresShipping && (
            <label className="mt-3 flex cursor-pointer items-center gap-3 text-sm font-medium">
              <input
                type="checkbox"
                name="billingSameAsShipping"
                checked={sameAsShipping}
                onChange={(e) => {
                  setSameAsShipping(e.target.checked);
                  // The billing fields are hidden, so drop their problems.
                  if (e.target.checked) setErrors((current) => without(current, "billing."));
                }}
                className="size-4 accent-ink"
              />
              {m.checkout.sameAsShipping}
            </label>
          )}
          {(!view.requiresShipping || !sameAsShipping) && (
            <div className="mt-4">
              <AddressFields section="billing" countries={countries.billing} initial={billingInitial} errors={sectionErrors(errors, "billing")} />
            </div>
          )}
        </div>
      </Section>

      <div className="space-y-4 pt-2">
        {lineIssues && (
          <Notice tone="problem" title={m.checkout.itemsNeedAttention}>
            <p>
              {m.checkout.itemsCannotBeOrdered}{" "}
              <Link href="/cart" className="font-semibold underline underline-offset-2">
                {m.checkout.reviewCart}
              </Link>
            </p>
          </Notice>
        )}
        {!busy && (message || (attempted && errorList.length > 0)) && (
          <div ref={alertRef} tabIndex={-1} role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 outline-none focus-visible:ring-2 focus-visible:ring-red-700">
            <p className="flex items-center gap-2 font-semibold">
              <CircleAlert aria-hidden className="size-4 shrink-0" />
              {errorList.length ? m.checkout.checkDetails : m.checkout.notPlaced}
            </p>
            {message && <p className="mt-1">{message}</p>}
            {errorList.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {errorList.map(([field, text]) => {
                  const anchor = anchorFor(field);
                  const section = sectionLabel(field, m);
                  const label = section ? t.f(m.checkout.problemIn, { section, problem: text }) : text;
                  return (
                    <li key={field}>
                      {anchor ? (
                        <a href={`#${anchor}`} className="underline underline-offset-2 hover:text-red-950">
                          {label}
                        </a>
                      ) : (
                        label
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {(state.reason === "stock" || state.reason === "closed" || state.reason === "expired") && (
              <p className="mt-2">
                <Link href="/cart" className="font-semibold underline underline-offset-2">
                  {m.checkout.goToCart}
                </Link>
              </p>
            )}
          </div>
        )}
        <p className="flex items-baseline justify-between gap-4">
          <span className="font-medium">{m.checkout.total}</span>
          <span className="text-xl font-semibold tabular-nums">{view.total?.formatted}</span>
        </p>
        <button type="submit" disabled={!ready || busy} className={cx(buttonClass("primary", "light", "lg"), "w-full")}>
          {busy || (kind === "stripe" && !stripe) ? <Spinner /> : <Lock aria-hidden className="size-4" />}
          {preparing && kind === "stripe" ? m.checkout.confirmingPayment : busy ? m.checkout.placingOrder : payLabel}
        </button>
      </div>
    </form>
  );
}
