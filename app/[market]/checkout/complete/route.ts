import type { NextRequest } from "next/server";
import { loadCheckoutCart, placeOrder, type PlaceOrderResult } from "@/lib/checkout";
import { inMarket, localized } from "@/lib/market";
import { readStripeReturn, rememberStripeReturnOrder } from "@/lib/stripe-return";

const go = async (location: string) => new Response(null, { status: 303, headers: { location: await localized(location), "cache-control": "no-store" } });

/**
 * Stripe's return_url, for payments confirmed off-site (3-D Secure, bank redirects). The
 * idempotency key comes from the PaymentIntent, so a reload cannot place a second order.
 */
export async function GET(request: NextRequest, { params }: RouteContext<"/[market]/checkout/complete">) {
  // Route Handlers cannot read root params: the market is this route's own parameter.
  return inMarket((await params).market, () => complete(request));
}

const complete = async (request: NextRequest) => {
  const params = request.nextUrl.searchParams;
  const intent = params.get("payment_intent") ?? "";
  if (!/^pi_[A-Za-z0-9_]{1,190}$/.test(intent)) return go("/checkout");
  if (!["succeeded", "processing", "requires_capture"].includes(params.get("redirect_status") ?? "")) return go("/checkout?payment=failed");

  let result: PlaceOrderResult;
  try {
    const binding = await readStripeReturn(intent, params.get("payment_intent_client_secret") ?? "");
    if (!binding) return go("/checkout");
    if (!binding.hasCart) {
      return go(binding.orderNumber ? `/checkout/confirmation/${encodeURIComponent(binding.orderNumber)}` : "/checkout");
    }
    // A webhook may have converted the bound cart already (null); the API then returns its
    // existing order. An open cart must still be this Stripe session's positive-total cart.
    const cart = await loadCheckoutCart();
    if (cart && (cart.id !== binding.cartId || cart.selectedPayment?.provider !== "stripe" || !cart.selectedPayment.sessionRequired || !(Number(cart.cost?.total?.amount) > 0))) return go("/checkout");
    result = await placeOrder(`stripe-${intent}`, {});
    if (result.ok) await rememberStripeReturnOrder(result.number);
  } catch (error) {
    console.error("Placing the order after the payment redirect failed", error);
    return go("/checkout?payment=error");
  }
  if (result.ok) return go(`/checkout/confirmation/${encodeURIComponent(result.number)}`);
  return go(`/checkout?payment=${result.reason}`);
};
