"use client";

import { Tag, X } from "lucide-react";
import { useActionState, useMemo, useRef } from "react";
import { useMarket, useT } from "@/components/market-provider";
import { buttonClass } from "@/components/ui/button";
import { applyCouponAction, removeCouponAction } from "@/lib/checkout-actions";
import { IDLE_FORM } from "@/lib/checkout-types";
import { couponReason } from "@/lib/coupons";
import { cx } from "@/lib/cx";
import { controlClass, FieldError, fieldId, Spinner, useFocusOnError } from "./fields";

type Coupon = { code: string; applied: boolean; reason: string | null };

export function CouponForm({ form, coupons }: { form: string; coupons: Coupon[] }) {
  const { key: market } = useMarket().current;
  const { m, f } = useT();
  const apply = useMemo(() => applyCouponAction.bind(null, market), [market]);
  const remove = useMemo(() => removeCouponAction.bind(null, market), [market]);
  const [state, formAction, pending] = useActionState(apply, IDLE_FORM);
  const formRef = useRef<HTMLFormElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  useFocusOnError(state, formRef, summaryRef);
  const id = fieldId(form, "code");
  const error = state.errors.code ?? state.message;

  return (
    <div>
      <form ref={formRef} action={formAction} noValidate className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor={id} className="sr-only">
            {m.coupon.label}
          </label>
          <input
            id={id}
            name="code"
            placeholder={m.coupon.label}
            defaultValue={state.status === "error" ? (state.values.code ?? "") : ""}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={64}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className={cx(controlClass(!!error, "md"), "uppercase placeholder:normal-case")}
          />
        </div>
        <button type="submit" disabled={pending} className={cx(buttonClass("secondary"), "shrink-0")}>
          {pending && <Spinner />}
          {pending ? m.coupon.applying : m.coupon.apply}
        </button>
      </form>
      <FieldError id={`${id}-error`} message={error} />
      {coupons.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label={m.coupon.codes}>
          {coupons.map((coupon) => (
            <li key={coupon.code}>
              <form action={remove} className={cx("inline-flex items-center gap-1.5 rounded-full py-1 pr-1 pl-3 text-xs font-semibold", coupon.applied ? "bg-brand-soft text-brand-strong" : "bg-stone-100 text-stone-500")}>
                <input type="hidden" name="code" value={coupon.code} />
                <Tag aria-hidden className="size-3.5" />
                <span>{coupon.code}</span>
                {!coupon.applied && <span className="font-normal">· {coupon.reason ? f(m.coupon.notAppliedBecause, { reason: couponReason(coupon.reason, m) }) : m.coupon.notApplied}</span>}
                <button type="submit" aria-label={f(m.coupon.remove, { code: coupon.code })} className="flex size-6 items-center justify-center rounded-full transition-colors hover:bg-black/10">
                  <X aria-hidden className="size-3.5" />
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
