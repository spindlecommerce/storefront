"use client";

import { ChevronDown, CircleAlert, LoaderCircle } from "lucide-react";
import { useEffect, type InputHTMLAttributes, type ReactNode, type RefObject, type SelectHTMLAttributes } from "react";
import { useT } from "@/components/market-provider";
import type { FormState } from "@/lib/checkout-types";
import { cx } from "@/lib/cx";

/**
 * Checkout form fields. Ids are `<form>-<name>` so the error summary can link to them; `inputName`
 * is the submitted name when it differs ("shipping.city").
 */

export const fieldId = (form: string, name: string) => `${form}-${name}`;
const errorId = (id: string) => `${id}-error`;
const hintId = (id: string) => `${id}-hint`;

const describedBy = (id: string, error?: string, hint?: string) => [error ? errorId(id) : null, hint ? hintId(id) : null].filter(Boolean).join(" ") || undefined;

/** 16px text, so phones do not zoom in on focus. */
export const controlClass = (invalid: boolean, size: "md" | "lg" = "lg") =>
  cx(
    "block w-full rounded-xl border bg-white px-4 text-base text-ink transition-colors placeholder:text-stone-400",
    size === "lg" ? "h-12" : "h-11",
    invalid ? "border-red-600" : "border-stone-300 hover:border-stone-400",
  );

export function FieldError({ id, message }: { id: string; message?: string | null }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-sm text-red-700">
      <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
      {message}
    </p>
  );
}

type FieldProps = { form: string; name: string; inputName?: string; label: string; error?: string; hint?: string; optional?: boolean; className?: string };

function Label({ id, label, optional }: { id: string; label: string; optional?: boolean }) {
  const { m } = useT();
  return (
    <label htmlFor={id} className="block text-sm font-medium text-stone-700">
      {label}
      {optional && <span className="font-normal text-stone-500"> {m.address.optional}</span>}
    </label>
  );
}

export function TextField({ form, name, inputName, label, error, hint, optional, className, ...input }: FieldProps & Omit<InputHTMLAttributes<HTMLInputElement>, "form" | "name" | "id">) {
  const id = fieldId(form, name);
  return (
    <div className={className}>
      <Label id={id} label={label} optional={optional} />
      <input id={id} name={inputName ?? name} aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, error, hint)} className={cx(controlClass(!!error), "mt-1.5")} {...input} />
      {hint && (
        <p id={hintId(id)} className="mt-1.5 text-sm text-stone-500">
          {hint}
        </p>
      )}
      <FieldError id={errorId(id)} message={error} />
    </div>
  );
}

export function SelectField({ form, name, inputName, label, error, hint, optional, className, children, ...select }: FieldProps & Omit<SelectHTMLAttributes<HTMLSelectElement>, "form" | "name" | "id">) {
  const id = fieldId(form, name);
  return (
    <div className={className}>
      <Label id={id} label={label} optional={optional} />
      <div className="relative mt-1.5">
        <select id={id} name={inputName ?? name} aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, error, hint)} className={cx(controlClass(!!error), "appearance-none pr-10")} {...select}>
          {children}
        </select>
        <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-stone-500" />
      </div>
      <FieldError id={errorId(id)} message={error} />
    </div>
  );
}

/** `details` show under the card while it is chosen. */
export function RadioCard({
  name,
  value,
  checked,
  onChange,
  invalid,
  errorFor,
  disabled,
  details,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  invalid?: boolean;
  /** The id of the group's error message. */
  errorFor?: string;
  disabled?: boolean;
  details?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className={cx(
        "rounded-2xl border transition-colors",
        checked ? "border-ink bg-stone-50 ring-1 ring-ink" : cx("bg-white", invalid ? "border-red-600" : "border-stone-300"),
        !checked && !disabled && "hover:border-stone-400",
        disabled && "opacity-60",
      )}
    >
      <label className={cx("flex items-start gap-3 p-4", disabled ? "cursor-not-allowed" : "cursor-pointer")}>
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={(e) => e.target.checked && onChange(value)}
          disabled={disabled}
          // aria-invalid does not apply to radios; the group's error is in their description.
          data-invalid={invalid ? true : undefined}
          aria-describedby={invalid ? errorFor : undefined}
          className="mt-0.5 size-4 shrink-0 accent-ink"
        />
        <span className="min-w-0 flex-1">{children}</span>
      </label>
      {checked && details && <div className="px-4 pb-4 sm:pl-11">{details}</div>}
    </div>
  );
}

/** After a failed submit, focuses the first field at fault, or the summary. */
export function useFocusOnError(state: FormState, formRef: RefObject<HTMLFormElement | null>, summaryRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (state.status !== "error") return;
    const invalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid]');
    (invalid ?? summaryRef.current)?.focus();
  }, [state, formRef, summaryRef]);
}

export function Spinner() {
  return <LoaderCircle aria-hidden className="size-4 animate-spin" />;
}
