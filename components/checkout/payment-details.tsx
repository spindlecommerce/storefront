"use client";

import { FlaskConical } from "lucide-react";
import dynamic from "next/dynamic";
import { useT } from "@/components/market-provider";
import { TEST_TOKENS, type CheckoutView, type PaymentKind, type PaymentMethod } from "@/lib/checkout-types";
import { Notice, PaymentFormLoading } from "./notice";
import type { StripeHandle } from "./stripe-payment";

/** Stripe's code (and Stripe.js) load only when a Stripe payment method is chosen. */
const StripePayment = dynamic(() => import("./stripe-payment"), { ssr: false, loading: () => <PaymentFormLoading /> });

export function TestModeBadge() {
  const { m } = useT();
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-ember">
      <FlaskConical aria-hidden className="size-3" />
      {m.payment.testMode}
    </span>
  );
}

/** `ready` is false until the cart has switched to the method, which a payment session needs. */
export function PaymentDetails({
  kind,
  method,
  view,
  ready,
  onStripe,
  renew,
}: {
  kind: PaymentKind;
  method: PaymentMethod;
  view: CheckoutView;
  ready: boolean;
  onStripe: (handle: StripeHandle | null) => void;
  renew: number;
}) {
  const { m, f } = useT();
  switch (kind) {
    case "test_gateway":
      return (
        <fieldset className="rounded-2xl border border-dashed border-accent/40 bg-accent-soft/40 p-4">
          <legend className="flex items-center gap-2 px-1 text-sm font-semibold">
            {m.payment.testCard} <TestModeBadge />
          </legend>
          <p className="text-sm text-stone-600">{m.payment.testCardHint}</p>
          <div className="mt-3 space-y-2">
            {TEST_TOKENS.map(({ token, text }) => (
              <label key={token} className="flex cursor-pointer items-start gap-3 rounded-xl p-2 text-sm hover:bg-white/60">
                <input type="radio" name="token" value={token} defaultChecked={token === "tok_visa"} className="mt-0.5 size-4 shrink-0 accent-ink" />
                <span>
                  <span className="font-medium">{m.payment.testCards[text].label}</span> <span className="text-stone-500">{m.payment.testCards[text].result}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      );
    case "stripe":
      return ready ? <StripePayment total={view.total} email={view.email} billing={view.billingAddress} register={onStripe} renew={renew} /> : <PaymentFormLoading />;
    case "offline":
      return (
        <div className="space-y-1 text-sm text-stone-600">
          {method.instructions && <p className="whitespace-pre-line">{method.instructions}</p>}
          <p>{m.payment.payLater}</p>
        </div>
      );
    case "unsupported":
      return (
        <Notice tone="problem" title={f(m.payment.unsupportedTitle, { method: method.name })}>
          <p>{f(m.payment.unsupportedText, { method: method.name })}</p>
        </Notice>
      );
    default:
      return <p className="text-sm whitespace-pre-line text-stone-600">{method.instructions ?? m.payment.noDetails}</p>;
  }
}
