import { CircleCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "@/components/ui/link";
import { unstable_rethrow } from "next/navigation";
import type { ReactNode } from "react";
import { AddressView } from "@/components/checkout/address-view";
import { CartCleared } from "@/components/checkout/cart-cleared";
import { discountLabel, negative, SummaryLines, TotalRow } from "@/components/checkout/order-summary";
import { buttonClass } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getCheckoutCountries, getPlacedOrder, type PlacedOrder } from "@/lib/checkout";
import { isZero, type Country } from "@/lib/checkout-types";
import { rich } from "@/lib/i18n";
import { getT } from "@/lib/market";
import type { Money } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).m.confirmation.title, robots: { index: false, follow: false } };
}

// Per shopper: never prerendered.
export const dynamic = "force-dynamic";

const decode = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

/**
 * Shipping before its discounts, which already show as discount rows. Derived from total =
 * subtotal − discounts + shipping + tax (unless included).
 */
const shippingPrice = (order: PlacedOrder, free: string): string | null => {
  const t = order.totals;
  if (!t?.total || !t.subtotal || !t.shipping) return t?.shipping?.formatted ?? null;
  const discounts = (t.discounts ?? []).flatMap((d) => (d.amount ? [d.amount] : []));
  const digits = Math.max(0, ...[t.total, t.subtotal, t.shipping, t.tax, ...discounts].map((m) => (m as Money | null)?.amount.split(".")[1]?.length ?? 0));
  const minor = (m: Money | null) => (m ? Math.round(Number(m.amount) * 10 ** digits) : 0);
  const price = minor(t.total) - minor(t.subtotal) + discounts.reduce((sum, d) => sum + minor(d), 0) - (t.pricesIncludeTax ? 0 : minor(t.tax));
  if (price === 0) return free;
  if (price === minor(t.shipping)) return t.shipping.formatted;
  try {
    return new Intl.NumberFormat(order.locale ?? "en-US", { style: "currency", currency: order.currencyCode }).format(price / 10 ** digits);
  } catch {
    return t.shipping.formatted;
  }
};

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-6 ring-1 ring-line">
      <h2 className="text-sm font-semibold tracking-wide text-stone-500 uppercase">{title}</h2>
      <div className="mt-3 text-sm leading-6">{children}</div>
    </section>
  );
}

const load = async (number: string) => {
  try {
    const [placed, countries] = await Promise.all([getPlacedOrder(number), getCheckoutCountries().then((c) => c.billing, (): Country[] => [])]);
    return { placed, countries, failed: false };
  } catch (error) {
    unstable_rethrow(error);
    console.error("Could not load the order", error);
    return { placed: null, countries: [], failed: true };
  }
};

/** Only the browser that placed the order sees it, through a short-lived httpOnly cookie. */
export default async function ConfirmationPage({ params }: { params: Promise<{ number: string }> }) {
  const number = decode((await params).number);
  const { m, f } = await getT();
  const { placed, countries, failed } = await load(number);

  if (!placed) {
    return (
      <Container width="narrow" className="py-20 text-center sm:py-28">
        <CartCleared />
        <h1 className="text-3xl font-semibold tracking-tight">{f(m.confirmation.order, { number })}</h1>
        <p className="mt-4 text-pretty text-stone-600">{failed ? m.confirmation.loadFailed : m.confirmation.onlyHere}</p>
        <div className="mt-8 flex justify-center">
          <Link href="/" className={buttonClass("primary")}>
            {m.cart.continueShopping}
          </Link>
        </div>
      </Container>
    );
  }

  const { order, paymentMethod } = placed;
  const totals = order.totals;
  const firstName = order.billingAddress?.firstName;
  const instructions = order.paymentStatus === "PENDING" ? paymentMethod?.instructions : null;

  return (
    <Container width="normal" className="py-10 sm:py-16">
      <CartCleared />
      <div className="text-center">
        <CircleCheck aria-hidden className="mx-auto size-12 text-brand" strokeWidth={1.5} />
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{firstName ? f(m.confirmation.thanksName, { name: firstName }) : m.confirmation.thanks}</h1>
        <p className="mt-3 text-pretty text-stone-600">
          {rich(m.confirmation.confirmed, {
            number: (
              <strong key="number" className="font-semibold text-ink">
                {order.number}
              </strong>
            ),
            email: (
              <strong key="email" className="font-semibold text-ink">
                {order.email}
              </strong>
            ),
          })}
        </p>
      </div>

      {instructions && (
        <section aria-labelledby="how-to-pay" className="mt-10 rounded-3xl bg-accent-soft p-6">
          <h2 id="how-to-pay" className="text-lg font-semibold">
            {m.confirmation.howToPay}
          </h2>
          <p className="mt-2 whitespace-pre-line text-stone-700">{instructions}</p>
          <p className="mt-3 text-sm text-stone-700">
            {rich(m.confirmation.amountDue, {
              amount: (
                <strong key="amount" className="font-semibold text-ink">
                  {totals?.total?.formatted}
                </strong>
              ),
              number: order.number,
            })}
          </p>
        </section>
      )}

      <section aria-labelledby="order-summary" className="mt-10 rounded-3xl bg-white p-6 ring-1 ring-line">
        <h2 id="order-summary" className="text-lg font-semibold">
          {m.checkout.orderSummary}
        </h2>
        <div className="mt-6">
          <SummaryLines lines={order.lines.map((line) => ({ ...line, issue: null }))} />
        </div>
        <dl className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
          <TotalRow label={m.checkout.subtotal} value={totals?.subtotal?.formatted} />
          {(totals?.discounts ?? [])
            .filter((d) => !isZero(d.amount))
            .map((d, i) => (
              <TotalRow key={`${d.name}-${i}`} label={discountLabel(d)} value={negative(d.amount)} tone="discount" />
            ))}
          {order.shippingMethod && <TotalRow label={m.checkout.shipping} value={shippingPrice(order, m.checkout.free)} />}
          <TotalRow label={totals?.pricesIncludeTax ? m.checkout.taxIncluded : m.checkout.tax} value={totals?.tax?.formatted} />
          <TotalRow label={m.checkout.total} value={totals?.total?.formatted} total />
        </dl>
      </section>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {order.shippingAddress && (
          <Card title={m.confirmation.shippingAddress}>
            <AddressView address={order.shippingAddress} countries={countries} />
          </Card>
        )}
        {order.shippingMethod && <Card title={m.confirmation.shippingMethod}>{order.shippingMethod.name}</Card>}
        {order.billingAddress && (
          <Card title={m.confirmation.billingAddress}>
            <AddressView address={order.billingAddress} countries={countries} />
          </Card>
        )}
        <Card title={m.confirmation.payment}>
          <p>{paymentMethod?.name ?? m.confirmation.payment}</p>
          {order.paymentStatus && <p className="text-stone-500">{m.confirmation.paymentStatus[order.paymentStatus] ?? order.paymentStatus}</p>}
        </Card>
      </div>

      <div className="mt-10 flex justify-center">
        <Link href="/" className={buttonClass("primary", "light", "lg")}>
          {m.cart.continueShopping}
        </Link>
      </div>
    </Container>
  );
}
