import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  values: new Map<string, { value: string; path: string }>(),
  path: "/en-US/checkout",
  set: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@spindlecommerce/storefront-next", () => ({ CART_COOKIE: "spindle_cart" }));
vi.mock("next/headers", () => ({ cookies: async () => ({
  get: (name: string) => {
    const value = state.values.get(name);
    return value && state.path.startsWith(value.path) ? { value: value.value } : undefined;
  },
  set: (name: string, value: string, options: { path: string }) => {
    state.set(name, value, options);
    state.values.set(name, { value, path: options.path });
  },
}) }));
vi.mock("@/lib/market", () => ({ localized: async (path: string) => `/en-US${path}` }));

import { readStripeReturn, rememberStripeReturn, rememberStripeReturnOrder } from "../lib/stripe-return";

const secret = "pi_actual_secret_unpredictable";
const callback = async (intent = "pi_actual", suppliedSecret = secret) => {
  state.path = "/en-US/checkout/complete";
  return readStripeReturn(intent, suppliedSecret);
};
const issue = async () => {
  state.values.set("spindle_cart", { value: "cart-1", path: "/" });
  await rememberStripeReturn("cart-1", secret);
};

beforeEach(() => {
  vi.useRealTimers();
  state.values.clear();
  state.path = "/en-US/checkout";
  state.set.mockClear();
});

describe("Stripe return state", () => {
  it("stores a scoped httpOnly fingerprint and accepts only its matching session", async () => {
    await issue();
    expect(state.set).toHaveBeenCalledWith("spindle_stripe_return", expect.not.stringContaining(secret), expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/en-US/checkout/complete", maxAge: 30 * 24 * 60 * 60 }));
    expect(await callback()).toEqual({ cartId: "cart-1", hasCart: true, orderNumber: undefined });
  });

  it("rejects absent state, wrong secrets, wrong intents and switched carts", async () => {
    expect(await callback()).toBeNull();
    await issue();
    expect(await callback("pi_actual", "pi_actual_secret_forged")).toBeNull();
    expect(await callback("pi_forged", secret)).toBeNull();
    state.values.set("spindle_cart", { value: "cart-2", path: "/" });
    expect(await callback()).toBeNull();
  });

  it("enforces expiry on the server even if a cookie is replayed", async () => {
    vi.useFakeTimers();
    await issue();
    vi.advanceTimersByTime(30 * 24 * 60 * 60 * 1000 + 1);
    expect(await callback()).toBeNull();
    vi.useRealTimers();
  });

  it("replaces prior bindings and removes return authorization for free sessions", async () => {
    await issue();
    await rememberStripeReturn("cart-1", "pi_replacement_secret_fresh");
    expect(await callback()).toBeNull();
    expect(await callback("pi_replacement", "pi_replacement_secret_fresh")).not.toBeNull();
    await rememberStripeReturn("cart-1", null);
    expect(await callback("pi_replacement", "pi_replacement_secret_fresh")).toBeNull();
    expect(state.set.mock.lastCall?.[2]).toEqual(expect.objectContaining({ maxAge: 0 }));
  });

  it("remembers a completed callback at a path available after cart-cookie clearing", async () => {
    await issue();
    expect(await callback()).not.toBeNull();
    await rememberStripeReturnOrder("ORDER-1");
    state.values.delete("spindle_cart");
    expect(await callback()).toEqual({ cartId: "cart-1", hasCart: false, orderNumber: "ORDER-1" });
  });

  it("does not share a binding with another market", async () => {
    await issue();
    state.path = "/de-DE/checkout/complete";
    expect(await readStripeReturn("pi_actual", secret)).toBeNull();
  });
});
