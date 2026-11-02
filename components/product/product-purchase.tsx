"use client";

import { useVariantSelection } from "@spindlecommerce/storefront-react/client";
import { Check, Minus, Plus } from "lucide-react";
import Link from "@/components/ui/link";
import { useState, type ReactNode } from "react";
import { useT } from "@/components/market-provider";
import { buttonClass } from "@/components/ui/button";
import { cx } from "@/lib/cx";
import type { PriceRange, ProductOption, ProductVariant } from "@/lib/types";
import { useAddToCart } from "@/lib/variants";
import { Price, PriceRangeLabel } from "./price";
import { ProductImage } from "./product-image";

export type GalleryImage = { id: string; src: string; optimize: boolean; alt: string };

type Props = {
  name: string;
  options: ProductOption[];
  variants: ProductVariant[];
  priceRange: PriceRange | null;
  images: GalleryImage[];
  /** Gallery index of each variant's own photo. */
  variantImage: Record<string, number>;
  /** On wide screens; on phones the gallery is always first. */
  galleryPosition?: "left" | "right";
  /** A line under the add to cart button, e.g. a delivery promise. */
  note?: ReactNode;
  /** Shown under the buttons, e.g. the description. */
  children?: ReactNode;
};

/** The product page's client part: gallery, option pickers and add to cart. */
export function ProductPurchase({ name, options, variants, priceRange, images, variantImage, galleryPosition = "left", note, children }: Props) {
  const { selection, variant, choose: chooseVariant, available: inStock } = useVariantSelection(variants);
  const [imageIndex, setImageIndex] = useState(() => {
    const first = variants.find((v) => v.isAvailable) ?? variants[0];
    return first ? (variantImage[first.id] ?? 0) : 0;
  });
  const [quantity, setQuantity] = useState(1);
  const t = useT();
  const { m } = t;
  const [state, formAction, pending] = useAddToCart();

  const maxQuantity = Math.max(1, Math.min(99, variant?.quantityAvailable ?? 99));
  const shownQuantity = Math.min(quantity, maxQuantity);

  const choose = (attribute: string, value: string) => {
    const chosen = chooseVariant(attribute, value);
    const image = chosen ? variantImage[chosen.id] : undefined;
    if (image !== undefined) setImageIndex(image);
  };

  const current = images[imageIndex] ?? images[0];
  const label = !variant ? m.product.selectOptions : !variant.isAvailable ? m.product.soldOut : pending ? m.product.adding : m.product.addToCart;

  const right = galleryPosition === "right";

  return (
    <div className={cx("grid gap-10 lg:gap-16", right ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]" : "lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]")}>
      <div className={right ? "lg:order-last" : undefined}>
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-stone-100">
          <ProductImage src={current?.src ?? null} optimize={current?.optimize ?? false} alt={current?.alt ?? name} name={name} sizes="(min-width: 1024px) 55vw, 100vw" eager />
        </div>
        {images.length > 1 && (
          <ul className="mt-4 grid grid-cols-5 gap-3">
            {images.map((image, i) => (
              <li key={image.id}>
                <button
                  type="button"
                  onClick={() => setImageIndex(i)}
                  aria-label={t.f(m.product.showImage, { number: i + 1, total: images.length })}
                  aria-pressed={i === imageIndex}
                  className={cx("relative block aspect-square w-full overflow-hidden rounded-xl bg-stone-100 ring-2 ring-offset-2 ring-offset-canvas transition", i === imageIndex ? "ring-ink" : "ring-transparent hover:ring-stone-300")}
                >
                  <ProductImage src={image.src} optimize={image.optimize} alt="" name={name} sizes="120px" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{name}</h1>
        <div className="mt-3 text-lg">{variant ? <Price price={variant.price} compareAt={variant.compareAtPrice} /> : <PriceRangeLabel range={priceRange} />}</div>

        <div className="mt-8 space-y-6">
          {options.map((option) => {
            const swatches = option.values.some((v) => v.swatch);
            const chosen = option.values.find((v) => v.code === selection[option.attribute.code]);
            return (
              <fieldset key={option.attribute.code}>
                <legend className="text-sm font-medium text-stone-700">
                  {option.attribute.label ?? option.attribute.code}
                  {chosen && <span className="ml-1.5 font-normal text-stone-500">{chosen.label}</span>}
                </legend>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {option.values.map((value) => {
                    const checked = selection[option.attribute.code] === value.code;
                    const available = inStock(option.attribute.code, value.code);
                    return (
                      <label key={value.code} className="relative cursor-pointer" title={available ? value.label : t.f(m.product.optionSoldOut, { label: value.label })}>
                        <input type="radio" name={`option-${option.attribute.code}`} value={value.code} checked={checked} onChange={() => choose(option.attribute.code, value.code)} className="peer sr-only" />
                        {swatches ? (
                          <span
                            className={cx(
                              "block size-9 rounded-full ring-1 ring-black/15 ring-inset outline-offset-2 peer-checked:outline-2 peer-checked:outline-ink peer-focus-visible:outline-2 peer-focus-visible:outline-brand",
                              !available && "opacity-40",
                            )}
                            style={{ backgroundColor: value.swatch ?? undefined }}
                          >
                            <span className="sr-only">{value.label}</span>
                          </span>
                        ) : (
                          <span
                            className={cx(
                              "flex h-10 min-w-12 items-center justify-center rounded-full border px-4 text-sm font-medium transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand",
                              checked ? "border-ink bg-ink text-white" : "border-stone-300 bg-white text-ink hover:border-ink",
                              !available && !checked && "text-stone-400 line-through",
                            )}
                          >
                            {value.label}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}
        </div>

        <form action={formAction} className="mt-8 flex flex-wrap items-center gap-3">
          <input type="hidden" name="variantId" value={variant?.id ?? ""} />
          <input type="hidden" name="quantity" value={shownQuantity} />
          <div className="flex h-12 items-center rounded-full border border-stone-300 bg-white">
            <button type="button" onClick={() => setQuantity(Math.max(1, shownQuantity - 1))} disabled={shownQuantity <= 1} className="flex size-12 items-center justify-center rounded-full text-ink disabled:text-stone-300" aria-label={m.product.decreaseQuantity}>
              <Minus aria-hidden className="size-4" />
            </button>
            <output aria-live="polite" aria-label={m.product.quantity} className="w-8 text-center text-sm font-semibold tabular-nums">
              {shownQuantity}
            </output>
            <button type="button" onClick={() => setQuantity(Math.min(maxQuantity, shownQuantity + 1))} disabled={shownQuantity >= maxQuantity} className="flex size-12 items-center justify-center rounded-full text-ink disabled:text-stone-300" aria-label={m.product.increaseQuantity}>
              <Plus aria-hidden className="size-4" />
            </button>
          </div>
          <button type="submit" disabled={!variant?.isAvailable || pending} className={cx(buttonClass("primary", "light", "lg"), "h-12 min-w-48 flex-1")}>
            {label}
          </button>
        </form>

        {note && <div className="mt-4 text-sm text-stone-600">{note}</div>}

        <div aria-live="polite" className="min-h-6">
          {state.message && (
            <p key={state.key} className={cx("mt-4 flex items-center gap-2 text-sm", state.status === "error" ? "text-red-700" : "text-brand")}>
              {state.status === "added" && <Check aria-hidden className="size-4" />}
              {state.message}
              {state.status === "added" && (
                <Link href="/cart" className="font-semibold underline underline-offset-4">
                  {m.product.viewCart}
                </Link>
              )}
            </p>
          )}
        </div>

        {variant && variant.isAvailable && variant.quantityAvailable !== null && variant.quantityAvailable <= 5 && <p className="mt-2 text-sm text-ember">{t.p(m.product.onlyLeft, variant.quantityAvailable)}</p>}
        {children && <div className="mt-10 border-t border-line pt-8">{children}</div>}
      </div>
    </div>
  );
}
