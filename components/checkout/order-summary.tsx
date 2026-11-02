import { ProductImage } from "@/components/product/product-image";
import type { CartLine } from "@/lib/cart";
import { lineIssueText } from "@/lib/cart-issues";
import type { CheckoutCart } from "@/lib/checkout";
import { isZero } from "@/lib/checkout-types";
import { cx } from "@/lib/cx";
import { imageUrl, isOptimizable } from "@/lib/images";
import { getT } from "@/lib/market";
import type { Money } from "@/lib/types";
import { CouponForm } from "./coupon-form";

type SummaryLine = Pick<CartLine, "id" | "name" | "quantity" | "issue"> & {
  quantityAvailable?: number | null;
  /** Before discounts and tax, so the lines add up to the subtotal below them. */
  subtotal: Money | null;
  product: { name: string; media: { url: string; alt: string | null; kind: string }[] } | null;
  variant: { selectedOptions: { name: string; label: string }[]; media: { url: string; alt: string | null }[] } | null;
};

/** Shared with the confirmation page. */
export async function SummaryLines({ lines }: { lines: SummaryLine[] }) {
  const t = await getT();
  return (
    <ul className="space-y-4">
      {lines.map((line) => {
        const media = line.variant?.media[0] ?? line.product?.media.find((m) => m.kind === "IMAGE");
        const options = line.variant?.selectedOptions.map((o) => t.f(t.m.cart.option, { name: o.name, value: o.label })).join(" · ");
        return (
          <li key={line.id} className="flex items-center gap-4">
            <div className="relative size-16 shrink-0">
              <div className="absolute inset-0 overflow-hidden rounded-xl bg-stone-100">
                <ProductImage src={media ? imageUrl(media.url) : null} optimize={media ? isOptimizable(media.url) : false} alt="" name={line.product?.name ?? line.name} sizes="64px" />
              </div>
              <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-stone-700 px-1 text-[11px] font-semibold text-white tabular-nums">
                <span className="sr-only">{t.m.checkout.quantity} </span>
                {line.quantity}
              </span>
            </div>
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-medium">{line.product?.name ?? line.name}</p>
              {options && <p className="text-stone-500">{options}</p>}
              {line.issue && <p className="text-ember">{lineIssueText(line.issue, line.quantityAvailable, t)}</p>}
            </div>
            <p className="shrink-0 text-sm font-medium tabular-nums">{line.subtotal?.formatted}</p>
          </li>
        );
      })}
    </ul>
  );
}

export function TotalRow({ label, value, tone, total }: { label: string; value: string | null | undefined; tone?: "muted" | "discount"; total?: boolean }) {
  return (
    <div className={cx("flex justify-between gap-4", total && "border-t border-line pt-3 text-base font-semibold", tone === "discount" && "text-brand")}>
      <dt className={cx(!total && tone !== "discount" && "text-stone-500")}>{label}</dt>
      <dd className={cx("text-right tabular-nums", tone === "muted" && "text-stone-500")}>{value}</dd>
    </div>
  );
}

export const discountLabel = (d: { name: string; couponCode: string | null }) => (d.couponCode ? `${d.name} (${d.couponCode})` : d.name);
export const negative = (money: Money | null) => (money ? `−${money.formatted}` : null);

/**
 * Priced by the API. Shipping shows at the method's own price, with shipping discounts among the
 * discounts.
 */
export async function OrderSummary({ cart, form }: { cart: CheckoutCart; form: string }) {
  const { m } = await getT();
  const cost = cart.cost;
  // Tax depends on the destination, and is priced once its address has a postal code.
  const destination = cart.requiresShipping ? cart.shippingAddress : cart.billingAddress;
  const later = cart.requiresShipping ? m.checkout.enterShippingAddress : m.checkout.enterBillingAddress;
  const shipping = cart.selectedShipping;
  return (
    <div className="space-y-6">
      <SummaryLines lines={cart.lines} />
      <CouponForm form={form} coupons={cart.coupons} />
      <dl className="space-y-3 border-t border-line pt-5 text-sm">
        <TotalRow label={m.checkout.subtotal} value={cost?.subtotal?.formatted} />
        {cart.discounts
          .filter((d) => !isZero(d.amount))
          .map((d, i) => (
            <TotalRow key={`${d.name}-${i}`} label={discountLabel(d)} value={negative(d.amount)} tone="discount" />
          ))}
        {cart.requiresShipping && <TotalRow label={m.checkout.shipping} value={shipping ? (isZero(shipping.price) ? m.checkout.free : shipping.price?.formatted) : later} tone={shipping ? undefined : "muted"} />}
        {cost?.pricesIncludeTax ? (
          <TotalRow label={m.checkout.taxIncluded} value={cost.tax?.formatted} />
        ) : (
          <TotalRow label={m.checkout.estimatedTax} value={destination?.postalCode ? cost?.tax?.formatted : later} tone={destination?.postalCode ? undefined : "muted"} />
        )}
        <TotalRow label={m.checkout.total} value={cost?.total?.formatted} total />
      </dl>
    </div>
  );
}
