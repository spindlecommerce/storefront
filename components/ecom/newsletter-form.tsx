"use client";

import { Check } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useT } from "@/components/market-provider";
import { rich } from "@/lib/i18n/translate";
import type { EditAttributes } from "@spindlecommerce/storefront-client";

type Props = { buttonLabel: string; buttonAttributes: EditAttributes; consent: string | null; consentAttributes: EditAttributes };

/** Sends nothing: the platform has no newsletter API. */
export function NewsletterForm({ buttonLabel, buttonAttributes, consent, consentAttributes }: Props) {
  const [email, setEmail] = useState<string | null>(null);
  const { m } = useT();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("email");
    setEmail(typeof value === "string" ? value : "");
  };

  if (email !== null) {
    return (
      <p role="status" className="flex items-start gap-3 rounded-2xl bg-white/10 p-4 text-sm">
        <Check aria-hidden className="mt-0.5 size-5 shrink-0" />
        <span>
          {rich(m.blocks.newsletterThanks, {
            email: (
              <strong key="email" className="font-semibold">
                {email}
              </strong>
            ),
          })}
        </span>
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="newsletter-email" className="sr-only">
          {m.blocks.newsletterEmail}
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder={m.blocks.newsletterPlaceholder}
          className="h-12 min-w-0 flex-1 rounded-full border border-white/20 bg-white/10 px-5 text-white placeholder:text-white/50 focus:border-white focus:outline-none"
        />
        <button type="submit" className="h-12 shrink-0 rounded-full bg-white px-6 font-semibold text-brand-strong transition-colors hover:bg-brand-soft" {...buttonAttributes}>
          {buttonLabel}
        </button>
      </div>
      {consent && (
        <p className="text-xs text-white/60" {...consentAttributes}>
          {consent}
        </p>
      )}
    </form>
  );
}
