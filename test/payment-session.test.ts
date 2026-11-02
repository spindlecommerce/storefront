import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ session: vi.fn(), cart: vi.fn(), remember: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/storefront", () => ({ storefront: { cart: async () => ({ checkout: { createPaymentSession: mocks.session, get: mocks.cart } }) } }));
vi.mock("@/lib/stripe-return", () => ({ rememberStripeReturn: mocks.remember }));
vi.mock("@/lib/market", () => ({ getT: async () => ({ m: { checkoutErrors: {} } }) }));

import { createPaymentSession } from "../lib/checkout";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.cart.mockResolvedValue({ id: "cart-1" });
});

it("binds a positive Stripe session to the current cart", async () => {
  const session = { provider: "stripe", clientData: { clientSecret: "pi_actual_secret_token" }, amount: { amount: "10.00" } };
  mocks.session.mockResolvedValue({ ok: true, session });
  expect(await createPaymentSession()).toEqual({ ok: true, ...session });
  expect(mocks.remember).toHaveBeenCalledWith("cart-1", "pi_actual_secret_token");
});

it("preserves free-session submission while removing callback authorization", async () => {
  const session = { provider: "stripe", clientData: { clientSecret: null }, amount: { amount: "0.00" } };
  mocks.session.mockResolvedValue({ ok: true, session });
  expect(await createPaymentSession()).toEqual({ ok: true, ...session });
  expect(mocks.remember).toHaveBeenCalledWith(null, null);
});
