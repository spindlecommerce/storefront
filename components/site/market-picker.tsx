"use client";

import { Check, Globe, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition, type ReactNode } from "react";
import { useMarket, useT } from "@/components/market-provider";
import { cx } from "@/lib/cx";
import { withoutPrefix, withPrefix } from "@/lib/locale-path";
import { changeMarketAction } from "@/lib/market-actions";

/**
 * A language is a URL prefix, so choosing one navigates; the currency is a cookie, so choosing one
 * refreshes. Either way the cart moves along.
 */
export function MarketPicker() {
  const { current, languages, currencies } = useMarket();
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const root = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    const onPointer = (event: PointerEvent) => !root.current?.contains(event.target as Node) && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const chooseLanguage = (locale: string, prefix: string) => {
    if (locale === current.locale) return setOpen(false);
    startTransition(async () => {
      await changeMarketAction(current.key, { locale });
      // The same page in the other language; its slug follows by redirect.
      const path = withoutPrefix(window.location.pathname, current.prefix);
      router.push(`${withPrefix(path, prefix)}${window.location.search}`);
      setOpen(false);
    });
  };

  const chooseCurrency = (code: string) => {
    if (code === current.currency) return setOpen(false);
    startTransition(async () => {
      await changeMarketAction(current.key, { currency: code });
      router.refresh();
      setOpen(false);
    });
  };

  if (languages.length < 2 && currencies.length < 2) return null;
  const language = languages.find((l) => l.locale === current.locale);
  const symbol = currencies.find((c) => c.code === current.currency)?.symbol ?? current.currency;
  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={t.f(t.m.picker.current, { language: language?.name ?? current.locale, currency: current.currency })}
        className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-ink transition-colors hover:bg-stone-200/60"
      >
        {pending ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : <Globe aria-hidden className="size-4" strokeWidth={1.75} />}
        <span className="uppercase">{current.locale.split("-")[0]}</span>
        <span aria-hidden className="text-stone-400">
          ·
        </span>
        <span>{symbol}</span>
      </button>
      {open && (
        <div id={panelId} role="dialog" aria-label={t.m.picker.label} className="absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl border border-line bg-white p-2 shadow-lg">
          {languages.length > 1 && (
            <Choices label={t.m.picker.language}>
              {languages.map((option) => (
                <Choice key={option.locale} selected={option.locale === current.locale} disabled={pending} onClick={() => chooseLanguage(option.locale, option.prefix)} lang={option.locale}>
                  {option.name}
                </Choice>
              ))}
            </Choices>
          )}
          {currencies.length > 1 && (
            <Choices label={t.m.picker.currency}>
              {currencies.map((option) => (
                <Choice key={option.code} selected={option.code === current.currency} disabled={pending} onClick={() => chooseCurrency(option.code)}>
                  <span className="inline-block w-5 text-stone-500">{option.symbol}</span>
                  {option.code}
                </Choice>
              ))}
            </Choices>
          )}
        </div>
      )}
    </div>
  );
}

function Choices({ label, children }: { label: string; children: ReactNode }) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id} className="py-1 [&+&]:border-t [&+&]:border-line">
      <p id={id} className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-[0.08em] text-stone-500">
        {label}
      </p>
      <ul>{children}</ul>
    </div>
  );
}

function Choice({ selected, disabled, onClick, lang, children }: { selected: boolean; disabled: boolean; onClick: () => void; lang?: string; children: ReactNode }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={selected}
        lang={lang}
        className={cx("flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-stone-100 disabled:opacity-60", selected ? "font-semibold text-ink" : "text-stone-700")}
      >
        <span>{children}</span>
        {selected && <Check aria-hidden className="size-4 text-brand" />}
      </button>
    </li>
  );
}
