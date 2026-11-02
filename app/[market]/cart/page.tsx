import { Lock, Minus, Plus, ShoppingBag, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "@/components/ui/link";
import { unstable_rethrow } from "next/navigation";
import { ProductImage } from "@/components/product/product-image";
import { buttonClass } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getCart, type Cart } from "@/lib/cart";
import { updateCartLineAction } from "@/lib/cart-actions";
import { lineIssueText } from "@/lib/cart-issues";
import { getMarket, getT } from "@/lib/market";
import { marketKey } from "@/lib/markets";
import { imageUrl, isOptimizable } from "@/lib/images";
import { productPath } from "@/lib/paths";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).m.cart.title, robots: { index: false, follow: false } };
}

// Per shopper: never prerendered.
export const dynamic = "force-dynamic";

const loadCart = async (): Promise<{ cart: Cart | null; failed: boolean }> => {
  try {
    return { cart: await getCart(), failed: false };
  } catch (error) {
    unstable_rethrow(error);
    console.error("Could not load the cart", error);
    return { cart: null, failed: true };
  }
};

type LineAction = (form: FormData) => Promise<void>;

function QuantityButton({ action, lineId, quantity, label, disabled, children }: { action: LineAction; lineId: string; quantity: number; label: string; disabled?: boolean; children: React.ReactNode }) {
  return (
    <form action={action}>
      <input type="hidden" name="lineId" value={lineId} />
      <input type="hidden" name="quantity" value={quantity} />
      <button type="submit" disabled={disabled} aria-label={label} className="flex size-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-stone-100 disabled:text-stone-300 disabled:hover:bg-transparent">
        {children}
      </button>
    </form>
  );
}

export default async function CartPage() {
  const { cart, failed } = await loadCart();
  const t = await getT();
  const { m } = t;
  // Server Actions cannot read the route's market: the page gives it.
  const updateLine = updateCartLineAction.bind(null, marketKey(await getMarket()));
  const lines = cart?.lines ?? [];

  return (
    <Container className="py-10 sm:py-16">
      <h1 className="text-4xl font-semibold tracking-tight">{m.cart.heading}</h1>
      {failed ? (
        <p className="mt-6 text-stone-600">{m.cart.loadFailed}</p>
      ) : lines.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-stone-300 px-6 py-16 text-center">
          <ShoppingBag aria-hidden className="mx-auto size-10 text-stone-300" strokeWidth={1.25} />
          <p className="mt-4 text-lg font-medium">{m.cart.empty}</p>
          <p className="mt-1 text-stone-500">{m.cart.emptyHint}</p>
          <Link href="/" className={`${buttonClass("primary")} mt-6`}>
            {m.cart.continueShopping}
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-16">
          <ul className="divide-y divide-line border-y border-line">
            {lines.map((line) => {
              const media = line.variant?.media[0] ?? line.product?.media.find((m) => m.kind === "IMAGE");
              const options = line.variant?.selectedOptions.map((o) => t.f(m.cart.option, { name: o.name, value: o.label })).join(" · ");
              const max = line.quantityAvailable ?? 99;
              return (
                <li key={line.id} className="flex gap-4 py-6 sm:gap-6">
                  <div className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-xl bg-stone-100 sm:w-28">
                    <ProductImage src={media ? imageUrl(media.url) : null} optimize={media ? isOptimizable(media.url) : false} alt={media?.alt || line.name} name={line.product?.name ?? line.name} sizes="112px" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="font-medium">{line.product ? <Link href={productPath(line.product.slug)} className="hover:underline">{line.product.name}</Link> : line.name}</h2>
                        {options && <p className="mt-1 text-sm text-stone-500">{options}</p>}
                        {line.unitPrice && <p className="mt-1 text-sm text-stone-500">{t.f(m.cart.each, { price: line.unitPrice.formatted })}</p>}
                      </div>
                      <p className="shrink-0 font-semibold">{line.total?.formatted}</p>
                    </div>
                    {line.issue && <p className="mt-2 text-sm text-ember">{lineIssueText(line.issue, line.quantityAvailable, t)}</p>}
                    <div className="mt-auto flex items-center justify-between pt-4">
                      <div className="flex items-center rounded-full border border-stone-300">
                        <QuantityButton action={updateLine} lineId={line.id} quantity={line.quantity - 1} label={line.quantity > 1 ? m.cart.decreaseQuantity : m.cart.remove}>
                          <Minus aria-hidden className="size-4" />
                        </QuantityButton>
                        <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-label={m.cart.quantity}>
                          {line.quantity}
                        </span>
                        <QuantityButton action={updateLine} lineId={line.id} quantity={line.quantity + 1} label={m.cart.increaseQuantity} disabled={line.quantity >= max}>
                          <Plus aria-hidden className="size-4" />
                        </QuantityButton>
                      </div>
                      <form action={updateLine}>
                        <input type="hidden" name="lineId" value={line.id} />
                        <input type="hidden" name="quantity" value={0} />
                        <button type="submit" className="inline-flex items-center gap-1 text-sm text-stone-500 transition-colors hover:text-ink">
                          <X aria-hidden className="size-4" /> {m.cart.remove}
                        </button>
                      </form>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <aside className="h-fit rounded-3xl bg-white p-6 ring-1 ring-line lg:sticky lg:top-24">
            <h2 className="text-lg font-semibold">{m.cart.summary}</h2>
            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone-500">{m.cart.subtotal}</dt>
                <dd className="font-medium">{cart?.cost?.subtotal?.formatted}</dd>
              </div>
              {cart?.cost?.discountTotal && Number(cart.cost.discountTotal.amount) > 0 && (
                <div className="flex justify-between text-brand">
                  <dt>{m.cart.discounts}</dt>
                  <dd>−{cart.cost.discountTotal.formatted}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-stone-500">{cart?.cost?.pricesIncludeTax ? m.cart.taxIncluded : m.cart.tax}</dt>
                <dd>{cart?.cost?.tax?.formatted}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">{m.cart.shipping}</dt>
                <dd className="text-stone-500">{m.cart.calculatedAtCheckout}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base font-semibold">
                <dt>{m.cart.total}</dt>
                <dd>{cart?.cost?.total?.formatted}</dd>
              </div>
            </dl>
            <Link href="/checkout" prefetch={false} className={`${buttonClass("primary", "light", "lg")} mt-6 w-full`}>
              <Lock aria-hidden className="size-4" />
              {m.cart.checkout}
            </Link>
          </aside>
        </div>
      )}
    </Container>
  );
}
