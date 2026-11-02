"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type { Appearance, Stripe, StripeElementLocale, StripeElements, StripePaymentElementOptions } from "@stripe/stripe-js";
// The pure entry point loads Stripe.js when loadStripe is first called, not on import.
import { loadStripe } from "@stripe/stripe-js/pure";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocalize, useMarket, useT } from "@/components/market-provider";
import { buttonClass } from "@/components/ui/button";
import { createPaymentSessionAction } from "@/lib/checkout-actions";
import type { Address } from "@/lib/checkout-types";
import type { Messages } from "@/lib/i18n/translate";
import type { Money } from "@/lib/types";
import { Notice, PaymentFormLoading } from "./notice";

/**
 * Stripe's Payment Element. Stripe.js loads from js.stripe.com, as PCI rules require. The payment
 * session creates the cart's PaymentIntent and updates it when the total changes. After confirming,
 * the order is placed with no payment data: the platform checks the PaymentIntent with Stripe.
 */

export type StripeOutcome = { ok: true } | { ok: false; message: string };
/** `submit` right away when the shopper pays, `confirm` once the details are saved. */
export type StripeHandle = { submit: () => Promise<StripeOutcome>; confirm: () => Promise<StripeOutcome> };

type Props = {
  total: Money | null;
  email: string | null;
  billing: Address | null;
  /** Gets the handle once the form is ready, null while it is not. */
  register: (handle: StripeHandle | null) => void;
  /** Changes after a failed placement (which may release the payment) to restart the session. */
  renew: number;
};

/** PaymentIntent statuses after which the order can be placed. */
const CONFIRMED = new Set(["succeeded", "processing", "requires_capture"]);

/** The storefront's colours (app/globals.css), which Stripe's iframe cannot read. */
const APPEARANCE: Appearance = {
  theme: "stripe",
  variables: {
    colorPrimary: "#5b3ef4",
    colorText: "#241948",
    colorDanger: "#c10007",
    colorBackground: "#ffffff",
    inputColorBorder: "#cdc7dc",
    borderRadius: "12px",
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
  },
};

/** Stripe's own regional variants; other locales use their language ("de-DE" is "de"). */
const STRIPE_REGIONAL = new Set(["en-AU", "en-CA", "en-NZ", "en-GB", "es-ES", "es-419", "fr-CA", "fr-FR", "it-IT", "pt-BR", "zh-HK", "zh-TW"]);
const stripeLocale = (locale: string) => (STRIPE_REGIONAL.has(locale) ? locale : locale.split("-")[0]!) as StripeElementLocale;

/** One Stripe.js per publishable key. A failed load is forgotten, so a retry loads again. */
const instances = new Map<string, Promise<Stripe | null>>();
const stripeFor = (publishableKey: string) => {
  let instance = instances.get(publishableKey);
  if (!instance) {
    instance = loadStripe(publishableKey);
    instances.set(publishableKey, instance);
    instance.catch(() => instances.delete(publishableKey));
  }
  return instance;
};

// Stripe's messages are in the Payment Element's language; `m` covers the rest.

const submitPayment = async (elements: StripeElements, m: Messages): Promise<StripeOutcome> => {
  const { error } = await elements.submit();
  return error ? { ok: false, message: error.message ?? m.payment.checkDetails } : { ok: true };
};

/** Redirect-based methods come back to `completePath`. */
const confirmPayment = async (stripe: Stripe, elements: StripeElements, completePath: string, m: Messages): Promise<StripeOutcome> => {
  const { error, paymentIntent } = await stripe.confirmPayment({
    elements,
    confirmParams: { return_url: `${window.location.origin}${completePath}` },
    redirect: "if_required",
  });
  if (error) {
    // Confirmed by an earlier attempt whose order wasn't placed (e.g. the connection dropped): place it now.
    if (error.payment_intent && CONFIRMED.has(error.payment_intent.status)) return { ok: true };
    return { ok: false, message: error.message ?? m.payment.notProcessed };
  }
  return paymentIntent && CONFIRMED.has(paymentIntent.status) ? { ok: true } : { ok: false, message: m.payment.notCompleted };
};

/** What checkout already knows, so the Payment Element does not ask again. */
const billingDetails = (email: string | null, billing: Address | null) => ({
  name: [billing?.firstName, billing?.lastName].filter(Boolean).join(" ") || undefined,
  email: email ?? undefined,
  phone: billing?.phone ?? undefined,
  address: billing
    ? {
        line1: billing.line1 ?? undefined,
        line2: billing.line2 ?? undefined,
        city: billing.city ?? undefined,
        state: billing.regionCode ?? billing.region ?? undefined,
        postal_code: billing.postalCode ?? undefined,
        country: billing.countryCode ?? undefined,
      }
    : undefined,
});

/** clientSecret is null when there is nothing to pay. `revision` counts the session's updates. */
type Session = ({ clientSecret: string; publishableKey: string } | { clientSecret: null }) & { revision: number };

const NOTHING_TO_PAY: StripeHandle = { submit: async () => ({ ok: true }), confirm: async () => ({ ok: true }) };

export default function StripePayment({ total, email, billing, register, renew }: Props) {
  const amount = total ? `${total.amount} ${total.currencyCode}` : "";
  const [session, setSession] = useState<Session | null>(null);
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tries, setTries] = useState(0);
  const { key: market, locale } = useMarket().current;
  const { m } = useT();

  // Create the session, and update it when the total changes or after a failed placement.
  useEffect(() => {
    let active = true;
    register(null);
    createPaymentSessionAction(market).then(
      (result) => {
        if (!active) return;
        if (!result.ok) return setError(result.message);
        const { clientSecret, publishableKey } = result.clientData;
        setError(null);
        if (clientSecret === null) {
          setSession((previous) => ({ clientSecret: null, revision: (previous?.revision ?? 0) + 1 }));
          register(NOTHING_TO_PAY);
        } else if (typeof clientSecret === "string" && typeof publishableKey === "string") {
          setSession((previous) => ({ clientSecret, publishableKey, revision: (previous?.revision ?? 0) + 1 }));
        } else {
          setError(m.payment.setupError);
        }
      },
      () => {
        if (active) setError(m.payment.loadError);
      },
    );
    return () => {
      active = false;
    };
  }, [amount, tries, renew, register, market, m]);

  const publishableKey = session?.clientSecret ? session.publishableKey : null;
  useEffect(() => {
    if (!publishableKey) return;
    let active = true;
    stripeFor(publishableKey).then(
      (loaded) => {
        if (!active) return;
        if (loaded) setStripe(loaded);
        else setError(m.payment.loadError);
      },
      () => {
        if (active) setError(m.payment.loadError);
      },
    );
    return () => {
      active = false;
    };
  }, [publishableKey, tries, m]);

  if (error) {
    return (
      <Notice
        tone="problem"
        title={m.payment.formUnavailable}
        action={
          <button
            type="button"
            className={buttonClass("secondary")}
            onClick={() => {
              setError(null);
              setTries((n) => n + 1);
            }}
          >
            {m.payment.retry}
          </button>
        }
      >
        <p>{error}</p>
      </Notice>
    );
  }
  if (session?.clientSecret === null) return <Notice>{m.payment.nothingToPay}</Notice>;
  if (!session || !stripe) return <PaymentFormLoading />;
  return (
    <Elements key={session.clientSecret} stripe={stripe} options={{ clientSecret: session.clientSecret, appearance: APPEARANCE, locale: stripeLocale(locale) }}>
      <PaymentForm revision={session.revision} email={email} billing={billing} register={register} onLoadError={setError} />
    </Elements>
  );
}

function PaymentForm({ revision, email, billing, register, onLoadError }: { revision: number; email: string | null; billing: Address | null; register: Props["register"]; onLoadError: (message: string) => void }) {
  const completePath = useLocalize()("/checkout/complete");
  const { m } = useT();
  const stripe = useStripe();
  const elements = useElements();
  const [ready, setReady] = useState(false);
  const synced = useRef(revision);

  // The session updated the PaymentIntent (e.g. its amount): let the Payment Element pick it up.
  useEffect(() => {
    if (!elements || synced.current === revision) return;
    synced.current = revision;
    elements.fetchUpdates().then(({ error }) => {
      if (error) console.error("Stripe could not update the payment form", error.message);
    });
  }, [elements, revision]);

  // Register again after every session update, which unregistered the form.
  useEffect(() => {
    if (!stripe || !elements || !ready) return;
    register({ submit: () => submitPayment(elements, m), confirm: () => confirmPayment(stripe, elements, completePath, m) });
    return () => register(null);
  }, [stripe, elements, ready, revision, register, completePath, m]);

  const options = useMemo<StripePaymentElementOptions>(() => ({ layout: "tabs", defaultValues: { billingDetails: billingDetails(email, billing) } }), [email, billing]);

  return <PaymentElement options={options} onReady={() => setReady(true)} onLoadError={(event) => onLoadError(event.error.message ?? m.payment.loadError)} />;
}
