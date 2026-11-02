"use client";

import { Check, ShoppingBag, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useId, useState, type MouseEvent } from "react";
import { useT } from "@/components/market-provider";
import Link from "@/components/ui/link";
import { cx } from "@/lib/cx";
import { productPath } from "@/lib/paths";
import { firstValue, hasValues, isOnSale, valuesWith, variantFor } from "@spindlecommerce/storefront-client";
import type { PriceRange, ProductOption, VariantSummary } from "@/lib/types";
import { cardOptions, photosFor, useAddToCart } from "@/lib/variants";
import { PriceRangeLabel } from "./price";
import { ProductImage } from "./product-image";

export type CardPhoto = { src: string; optimize: boolean; alt: string; variantId: string | null };

type Props = {
  name: string;
  slug: string;
  isAvailable: boolean;
  priceRange: PriceRange | null;
  options: ProductOption[];
  variants: VariantSummary[];
  /** In position order. */
  photos: CardPhoto[];
  showPrice: boolean;
  sizes: string;
  eager?: boolean;
};

/** How long the card shows the result of adding to the cart. */
const RESULT_MS = 5000;

const REVEAL =
  "group-hover/card:pointer-events-auto group-hover/card:translate-y-0 group-has-[:focus-visible]/card:pointer-events-auto group-has-[:focus-visible]/card:translate-y-0";
const BAG =
  "relative z-10 -my-1.5 hidden size-8 shrink-0 items-center justify-center rounded-full border border-stone-300 bg-white text-ink transition-colors disabled:opacity-40 aria-expanded:border-ink aria-expanded:bg-ink aria-expanded:text-white [@media(hover:none)]:flex";
const SIZE = "flex h-7 min-w-7 items-center justify-center rounded-full border bg-white px-1.5 text-xs font-semibold transition-colors sm:h-8 sm:min-w-8 sm:px-2";
const WIDE = "flex h-9 w-full items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors";

/**
 * The card's client part. Hovering, or keyboard focus, shows the second photo and quick add; touch
 * screens open quick add with the bag button. Picking a size adds it to the cart.
 */
export function ProductCardBody({ name, slug, isAvailable, priceRange, options, variants, photos, showPrice, sizes, eager }: Props) {
  const t = useT();
  const { m } = t;
  const id = useId();
  const { colour, size, onlyColourAndSize } = cardOptions(options);
  const [chosen, setChosen] = useState(() => (colour ? firstValue(variants, colour.attribute.code) : null));
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [state, formAction, pending] = useAddToCart();
  /** The key of the last result taken off the card. */
  const [cleared, setCleared] = useState(0);

  useEffect(() => {
    if (!state.key) return;
    const timer = setTimeout(() => setCleared(state.key), RESULT_MS);
    return () => clearTimeout(timer);
  }, [state.key]);

  const result = state.key !== cleared ? state : null;
  const selection = colour && chosen ? { [colour.attribute.code]: chosen } : {};
  const [photo, hover] = colour && chosen ? photosFor(photos, variants, colour.attribute.code, chosen) : photos;
  const href = productPath(slug);
  const mode = !isAvailable ? null : !onlyColourAndSize ? "link" : size ? "sizes" : "add";
  const single = mode === "add" ? variantFor(variants, selection) : undefined;
  const shown = open || pending || !!result;

  const pick = (value: string) => {
    setChosen(value);
    setCleared(state.key);
  };
  // aria-disabled rather than disabled, so the pressed button keeps focus.
  const holdWhilePending = (event: MouseEvent) => {
    if (pending) event.preventDefault();
  };

  return (
    <article className="group/card relative grid h-full grid-rows-[auto_1fr]">
      <div className="relative col-start-1 row-start-1 aspect-[4/5] overflow-hidden rounded-2xl bg-stone-100">
        <ProductImage
          src={photo?.src ?? null}
          optimize={photo?.optimize ?? false}
          alt={photo?.alt ?? name}
          name={name}
          sizes={sizes}
          eager={eager}
          className="transition duration-500 ease-out group-hover/card:scale-[1.03]"
        />
        {/* Not displayed without hover, so touch screens don't load it. */}
        {hover && hover.src !== failed && (
          <Image
            src={hover.src}
            alt=""
            fill
            sizes={sizes}
            unoptimized={!hover.optimize}
            onError={() => setFailed(hover.src)}
            className="hidden object-cover opacity-0 transition duration-500 ease-out group-hover/card:scale-[1.03] group-hover/card:opacity-100 [@media(hover:hover)]:block"
          />
        )}
        <div className="absolute left-3 top-3 flex gap-1.5">
          {!isAvailable && <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-stone-700 shadow-sm">{m.product.soldOut}</span>}
          {isOnSale(priceRange) && isAvailable && <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-ink shadow-sm">{m.product.sale}</span>}
        </div>
      </div>

      <div className="col-start-1 row-start-2 mt-4 flex flex-col gap-1">
        <div className="flex items-start gap-2">
          <h3 className="flex-1 text-sm font-medium text-ink">
            {/* Stretched link: the whole card is clickable, the name is what screen readers announce. */}
            <Link href={href} className="after:absolute after:inset-0 after:content-['']">
              {name}
            </Link>
          </h3>
          {mode === "sizes" && (
            <button
              type="button"
              aria-expanded={open}
              aria-controls={`${id}-quick-add`}
              aria-label={t.f(m.product.addNamed, { name })}
              onClick={() => {
                setOpen(!open);
                setCleared(state.key);
              }}
              className={BAG}
            >
              {open ? <X aria-hidden className="size-4" /> : <ShoppingBag aria-hidden className="size-4" />}
            </button>
          )}
          {mode === "add" && (
            <form action={formAction} className="contents">
              <button
                type="submit"
                name="variantId"
                value={single?.id ?? ""}
                disabled={!single?.isAvailable}
                aria-disabled={pending || undefined}
                aria-label={t.f(m.product.addNamed, { name })}
                onClick={holdWhilePending}
                className={BAG}
              >
                <ShoppingBag aria-hidden className="size-4" />
              </button>
            </form>
          )}
          {mode === "link" && (
            <Link href={href} aria-label={m.product.selectOptions} className={BAG}>
              <ShoppingBag aria-hidden className="size-4" />
            </Link>
          )}
        </div>
        {showPrice && <PriceRangeLabel range={priceRange} className="text-sm" />}
        {colour && colour.values.length > 1 && (
          <fieldset className="relative z-10 -ml-1 mt-1">
            <legend className="sr-only">{colour.attribute.label ?? colour.attribute.code}</legend>
            <div className="flex flex-wrap">
              {colour.values.map((value) => {
                const available = variants.some((v) => v.isAvailable && hasValues(v, { [colour.attribute.code]: value.code }));
                const label = available ? value.label : t.f(m.product.optionSoldOut, { label: value.label });
                return (
                  <label key={value.code} title={label} className="flex size-6 cursor-pointer items-center justify-center">
                    <input type="radio" name={`${id}-colour`} value={value.code} checked={value.code === chosen} onChange={() => pick(value.code)} className="peer sr-only" />
                    <span
                      aria-hidden
                      className={cx(
                        "size-4 rounded-full ring-1 ring-black/15 ring-inset outline-offset-2 peer-checked:outline-2 peer-checked:outline-ink peer-focus-visible:outline-2 peer-focus-visible:outline-brand",
                        !available && "opacity-40",
                      )}
                      style={{ backgroundColor: value.swatch ?? undefined }}
                    />
                    <span className="sr-only">{label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}
      </div>

      {mode && (
        <div className="pointer-events-none relative z-10 col-start-1 row-start-1 self-end overflow-hidden rounded-b-2xl p-2">
          <div
            id={`${id}-quick-add`}
            className={cx(
              "rounded-xl bg-white/95 p-2 shadow-lg ring-1 ring-black/5 backdrop-blur-sm transition duration-300 ease-out sm:p-2.5",
              shown ? "pointer-events-auto" : cx("translate-y-[calc(100%_+_0.5rem)]", REVEAL),
            )}
          >
            {mode === "sizes" && size && (
              <form action={formAction}>
                <div role="group" aria-labelledby={`${id}-sizes`}>
                  <p id={`${id}-sizes`} className="text-xs font-medium text-stone-500">
                    {pending ? m.product.adding : m.product.addToCart}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1 sm:mt-2 sm:gap-1.5">
                    {valuesWith(variants, size, selection).map(({ value, variant }) =>
                      variant.isAvailable ? (
                        <button
                          key={value.code}
                          type="submit"
                          name="variantId"
                          value={variant.id}
                          aria-disabled={pending || undefined}
                          onClick={holdWhilePending}
                          className={cx(SIZE, "border-stone-300 text-ink hover:border-ink hover:bg-ink hover:text-white")}
                        >
                          {value.label}
                        </button>
                      ) : (
                        <button
                          key={value.code}
                          type="button"
                          disabled
                          title={t.f(m.product.optionSoldOut, { label: value.label })}
                          aria-label={t.f(m.product.optionSoldOut, { label: value.label })}
                          className={cx(SIZE, "cursor-not-allowed border-stone-200 text-stone-400 line-through")}
                        >
                          {value.label}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              </form>
            )}
            {mode === "add" && (
              <form action={formAction}>
                <button
                  type="submit"
                  name="variantId"
                  value={single?.id ?? ""}
                  disabled={!single?.isAvailable}
                  aria-disabled={pending || undefined}
                  onClick={holdWhilePending}
                  className={cx(WIDE, "bg-brand text-white hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50")}
                >
                  {!single?.isAvailable ? m.product.soldOut : pending ? m.product.adding : m.product.addToCart}
                </button>
              </form>
            )}
            {mode === "link" && (
              <Link href={href} className={cx(WIDE, "border border-stone-300 bg-white text-ink hover:border-ink")}>
                {m.product.selectOptions}
              </Link>
            )}
            <div aria-live="polite">
              {result?.message && (
                <p key={result.key} className={cx("mt-2 flex flex-wrap items-center gap-x-1.5 text-xs", result.status === "error" ? "text-red-700" : "text-brand")}>
                  {result.status === "added" && <Check aria-hidden className="size-3.5" />}
                  {result.message}
                  {result.status === "added" && (
                    <Link href="/cart" className="font-semibold underline underline-offset-4">
                      {m.product.viewCart}
                    </Link>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
