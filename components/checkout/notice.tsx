"use client";

import { CircleAlert, Info } from "lucide-react";
import { useEffect, type ReactNode, type Ref } from "react";
import { useT } from "@/components/market-provider";
import { cx } from "@/lib/cx";

export function Notice({ tone = "info", title, children, action, noticeRef, className }: { tone?: "info" | "problem"; title?: string; children?: ReactNode; action?: ReactNode; noticeRef?: Ref<HTMLDivElement>; className?: string }) {
  const Icon = tone === "problem" ? CircleAlert : Info;
  return (
    <div
      ref={noticeRef}
      tabIndex={noticeRef ? -1 : undefined}
      className={cx("flex gap-3 rounded-2xl p-4 text-sm outline-none", tone === "problem" ? "border border-red-200 bg-red-50 text-red-800" : "bg-stone-100 text-stone-700", className)}
    >
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1 space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children}
        {action && <div className="pt-1">{action}</div>}
      </div>
    </div>
  );
}

export function PaymentFormLoading() {
  const { m } = useT();
  return (
    <div role="status" className="space-y-3 rounded-2xl border border-stone-200 p-4">
      <span className="sr-only">{m.payment.loading}</span>
      <div aria-hidden className="h-4 w-1/3 animate-pulse rounded bg-stone-200" />
      <div aria-hidden className="h-12 animate-pulse rounded-xl bg-stone-100" />
      <div aria-hidden className="grid grid-cols-2 gap-3">
        <div className="h-12 animate-pulse rounded-xl bg-stone-100" />
        <div className="h-12 animate-pulse rounded-xl bg-stone-100" />
      </div>
    </div>
  );
}

/** Drops ?payment from the URL, so a reload does not show the message again. */
export function ReturnNotice({ message }: { message: string }) {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("payment")) return;
    url.searchParams.delete("payment");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);
  return (
    <div role="alert" className="mt-6">
      <Notice tone="problem">
        <p>{message}</p>
      </Notice>
    </div>
  );
}
