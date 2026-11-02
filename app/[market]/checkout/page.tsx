import { ArrowLeft, ChevronDown, ShoppingBag } from "lucide-react";
import type { Metadata } from "next";
import Link from "@/components/ui/link";
import { unstable_rethrow } from "next/navigation";
import { CheckoutForm, CheckoutStatus, SummaryStatus } from "@/components/checkout/checkout-form";
import { Notice, ReturnNotice } from "@/components/checkout/notice";
import { OrderSummary } from "@/components/checkout/order-summary";
import { buttonClass } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { checkoutView, getCheckoutCart, getCheckoutCountries, type CheckoutCart } from "@/lib/checkout";
import type { CheckoutCountries } from "@/lib/checkout-details";
import type { PlaceOrderFailure } from "@/lib/checkout-types";
import type { Messages } from "@/lib/i18n";
import { getT } from "@/lib/market";
import type { SearchParams } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).m.checkout.title, robots: { index: false, follow: false } };
}

// Per shopper: never prerendered.
export const dynamic = "force-dynamic";

/** ?payment=<reason> from /checkout/complete, Stripe's return page. */
const RETURN_NOTICES: Record<PlaceOrderFailure | "failed", keyof Messages["checkout"]["returned"]> = {
  failed: "failed",
  declined: "declined",
  not_ready: "notReady",
  stock: "stock",
  closed: "closed",
  expired: "expired",
  invalid: "invalid",
  error: "error",
};

const load = async (): Promise<{ cart: CheckoutCart | null; countries: CheckoutCountries } | null> => {
  try {
    const [cart, countries] = await Promise.all([getCheckoutCart(), getCheckoutCountries()]);
    return { cart, countries };
  } catch (error) {
    unstable_rethrow(error);
    console.error("Could not load checkout", error);
    return null;
  }
};

/** One-page checkout. What the shopper types is saved as they go. */
export default async function CheckoutPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { m } = await getT();
  const reason = (await searchParams).payment;
  const notice = typeof reason === "string" && reason in RETURN_NOTICES ? m.checkout.returned[RETURN_NOTICES[reason as keyof typeof RETURN_NOTICES]] : null;
  const loaded = await load();
  const cart = loaded?.cart;

  return (
    <Container className="py-8 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{m.checkout.title}</h1>
        <Link href="/cart" className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 transition-colors hover:text-ink">
          <ArrowLeft aria-hidden className="size-4" /> {m.checkout.backToCart}
        </Link>
      </div>
      {notice && <ReturnNotice message={notice} />}

      {!loaded ? (
        <Notice tone="problem" className="mt-8">
          <p>{m.checkout.loadFailed}</p>
        </Notice>
      ) : !cart || cart.lines.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-stone-300 px-6 py-16 text-center">
          <ShoppingBag aria-hidden className="mx-auto size-10 text-stone-300" strokeWidth={1.25} />
          <p className="mt-4 text-lg font-medium">{m.cart.empty}</p>
          <p className="mt-1 text-stone-500">{m.checkout.emptyHint}</p>
          <Link href="/" className={`${buttonClass("primary")} mt-6`}>
            {m.cart.continueShopping}
          </Link>
        </div>
      ) : (
        <CheckoutStatus>
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-12">
          <div className="min-w-0 space-y-4">
            {/* On small screens the summary folds away above the form. */}
            <details className="group rounded-3xl bg-white ring-1 ring-line lg:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 [&::-webkit-details-marker]:hidden">
                <span className="inline-flex items-center gap-2 font-semibold">
                  {m.checkout.orderSummary}
                  <ChevronDown aria-hidden className="size-4 transition-transform group-open:rotate-180" />
                </span>
                <span className="font-semibold tabular-nums">{cart.cost?.total?.formatted}</span>
              </summary>
              <div className="border-t border-line p-5">
                <SummaryStatus>
                  <OrderSummary cart={cart} form="summary-mobile" />
                </SummaryStatus>
              </div>
            </details>
            <CheckoutForm view={checkoutView(cart)} countries={loaded.countries} />
          </div>
          <aside aria-labelledby="order-summary" className="hidden lg:block">
            <div className="sticky top-24 rounded-3xl bg-white p-6 ring-1 ring-line">
              <h2 id="order-summary" className="mb-6 text-lg font-semibold">
                {m.checkout.orderSummary}
              </h2>
              <SummaryStatus>
                <OrderSummary cart={cart} form="summary" />
              </SummaryStatus>
            </div>
          </aside>
        </div>
        </CheckoutStatus>
      )}
    </Container>
  );
}
