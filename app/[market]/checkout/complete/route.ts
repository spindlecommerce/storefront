import type { NextRequest } from "next/server";
import { loadCheckoutCart, placeOrder, type PlaceOrderResult } from "@/lib/checkout";
import { inMarket, localized } from "@/lib/market";

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
  // The payment did not go through: there is no order to place.
  if (["failed", "canceled", "requires_payment_method"].includes(params.get("redirect_status") ?? "")) return go("/checkout?payment=failed");

  let result: PlaceOrderResult;
  try {
    // A link to this page must not place an order without a payment session (e.g. an offline
    // method). A cart that is no longer open (null) goes on: placing returns the order it became.
    const cart = await loadCheckoutCart();
    if (cart && !cart.selectedPayment?.sessionRequired) return go("/checkout");
    result = await placeOrder(`stripe-${intent}`, {});
  } catch (error) {
    console.error("Placing the order after the payment redirect failed", error);
    return go("/checkout?payment=error");
  }
  if (result.ok) return go(`/checkout/confirmation/${encodeURIComponent(result.number)}`);
  return go(`/checkout?payment=${result.reason}`);
};
