import type { CheckoutCart } from "@spindlecommerce/storefront-client";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ cart: vi.fn(), place: vi.fn(), binding: vi.fn(), completed: vi.fn() }));
vi.mock("@/lib/checkout", () => ({ loadCheckoutCart: mocks.cart, placeOrder: mocks.place }));
vi.mock("@/lib/stripe-return", () => ({ readStripeReturn: mocks.binding, rememberStripeReturnOrder: mocks.completed }));
vi.mock("@/lib/market", () => ({ inMarket: (_key: string, work: () => unknown) => work(), localized: async (path: string) => `/en-US${path}` }));

import { GET } from "../app/[market]/checkout/complete/route";

const cart = (amount = "10.00", provider = "stripe", id = "cart-1") => ({ id, selectedPayment: { provider, sessionRequired: true }, cost: { total: { amount } } }) as CheckoutCart;
const request = (query = "payment_intent=pi_valid&payment_intent_client_secret=pi_valid_secret_token&redirect_status=succeeded") =>
  GET(new NextRequest(`https://shop.test/en-US/checkout/complete?${query}`), { params: Promise.resolve({ market: "en-US" }) });

beforeEach(() => {
  vi.resetAllMocks();
  mocks.cart.mockResolvedValue(cart());
  mocks.place.mockResolvedValue({ ok: true, number: "ORDER-1" });
  mocks.binding.mockResolvedValue(null);
});

describe("Stripe return authorization", () => {
  it("does not place a zero-total cart from a forged cross-site GET", async () => {
    mocks.cart.mockResolvedValue(cart("0.00"));
    expect((await request("payment_intent=pi_forged")).headers.get("location")).toMatch(/^\/en-US\/checkout(?:\?|$)/);
    expect(mocks.place).not.toHaveBeenCalled();
  });

  it("rejects an invented intent even with a success status", async () => {
    await request("payment_intent=pi_forged&redirect_status=succeeded");
    expect(mocks.place).not.toHaveBeenCalled();
  });

  it.each(["failed", "canceled", "requires_payment_method", "", "unknown"])("rejects return status %j", async (status) => {
    mocks.binding.mockResolvedValue({ cartId: "cart-1", hasCart: true });
    await request(`payment_intent=pi_valid&payment_intent_client_secret=pi_valid_secret_token&redirect_status=${status}`);
    expect(mocks.place).not.toHaveBeenCalled();
  });

  it.each([cart("0.00"), cart("10.00", "offline"), cart("10.00", "stripe", "another-cart")])("rejects carts inconsistent with a bound Stripe return", async (value) => {
    mocks.binding.mockResolvedValue({ cartId: "cart-1", hasCart: true });
    mocks.cart.mockResolvedValue(value);
    await request();
    expect(mocks.place).not.toHaveBeenCalled();
  });

  it("places a valid cart-bound payment and preserves its idempotency key", async () => {
    mocks.binding.mockResolvedValue({ cartId: "cart-1", hasCart: true });
    expect((await request()).headers.get("location")).toBe("/en-US/checkout/confirmation/ORDER-1");
    expect(mocks.place).toHaveBeenCalledWith("stripe-pi_valid", {});
    expect(mocks.binding).toHaveBeenCalledWith("pi_valid", "pi_valid_secret_token");
  });

  it("retries a bound cart already converted by a payment webhook", async () => {
    mocks.binding.mockResolvedValue({ cartId: "cart-1", hasCart: true });
    mocks.cart.mockResolvedValue(null);
    expect((await request()).headers.get("location")).toBe("/en-US/checkout/confirmation/ORDER-1");
  });

  it("reloads confirmation after successful placement cleared the cart cookie", async () => {
    mocks.binding.mockResolvedValue({ cartId: "cart-1", hasCart: false, orderNumber: "ORDER-1" });
    expect((await request()).headers.get("location")).toBe("/en-US/checkout/confirmation/ORDER-1");
    expect(mocks.completed).not.toHaveBeenCalled();
    expect(mocks.place).not.toHaveBeenCalled();
  });
});
