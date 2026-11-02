import "server-only";
import { createHash } from "node:crypto";
import { CART_COOKIE } from "@spindlecommerce/storefront-next";
import { cookies } from "next/headers";
import { localized } from "./market";

const COOKIE = "spindle_stripe_return";
// Match the SDK cart cookie so a delayed bank redirect can still recover its checkout.
const MAX_AGE = 30 * 24 * 60 * 60;
const fingerprint = (secret: string) => createHash("sha256").update(secret).digest("hex");
const intentOf = (secret: unknown) => typeof secret === "string" && secret.length <= 512 ? /^(pi_[A-Za-z0-9_]+)_secret_[A-Za-z0-9_]+$/.exec(secret)?.[1] : undefined;

type ReturnState = { cartId: string; intent: string; fingerprint: string; expiresAt: number; orderNumber?: string };

const writeState = async (state: ReturnState | null) => (await cookies()).set(COOKIE, state ? JSON.stringify(state) : "", {
  httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
  path: await localized("/checkout/complete"), maxAge: state ? Math.max(0, Math.ceil((state.expiresAt - Date.now()) / 1000)) : 0,
});

/** Only a session issued to this cart/browser can authorize its off-site payment return. */
export const rememberStripeReturn = async (cartId: string | null, clientSecret: unknown) => {
  const intent = intentOf(clientSecret);
  const state: ReturnState | null = cartId && intent && typeof clientSecret === "string"
    ? { cartId, intent, fingerprint: fingerprint(clientSecret), expiresAt: Date.now() + MAX_AGE * 1000 }
    : null;
  await writeState(state);
};

export const readStripeReturn = async (intent: string, clientSecret: string): Promise<{ cartId: string; hasCart: boolean; orderNumber?: string } | null> => {
  if (intentOf(clientSecret) !== intent) return null;
  const jar = await cookies();
  try {
    const state = JSON.parse(jar.get(COOKIE)?.value ?? "null") as ReturnState | null;
    if (!state || typeof state.cartId !== "string" || !state.cartId || state.intent !== intent ||
      typeof state.expiresAt !== "number" || state.expiresAt <= Date.now() || state.fingerprint !== fingerprint(clientSecret)) return null;
    const cartId = jar.get(CART_COOKIE)?.value;
    if (cartId && cartId !== state.cartId) return null;
    // A successful placement clears the cart cookie. The caller may then show only the order
    // remembered for this same cart; it must not submit a different cart.
    return { cartId: state.cartId, hasCart: !!cartId, orderNumber: typeof state.orderNumber === "string" ? state.orderNumber : undefined };
  } catch {
    return null;
  }
};

/** Called only after this callback was authorized and the bound cart was placed successfully. */
export const rememberStripeReturnOrder = async (orderNumber: string) => {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return;
  const state = JSON.parse(raw) as ReturnState;
  await writeState({ ...state, orderNumber });
};
