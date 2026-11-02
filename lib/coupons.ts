import type { Messages } from "./i18n/translate";

/** The API's English reasons a code does not apply, mapped to the storefront's messages. */
const REASONS: Record<string, keyof Messages["coupon"]["reasons"]> = {
  "unknown coupon": "unknown",
  "the promotion is not active": "notRunning",
  "the promotion is not running": "notRunning",
  "the coupon has expired": "expired",
  "not valid in this store": "store",
  "not valid for your customer group": "group",
  "the coupon has been used up": "usedUp",
  "the promotion has been used up": "usedUp",
  "you have already used this promotion": "alreadyUsed",
  "the cart does not meet the promotion's conditions": "conditions",
};

/** In the shopper's language, as a phrase to follow a colon. */
export const couponReason = (reason: string | null | undefined, m: Messages) => m.coupon.reasons[(reason && REASONS[reason]) || "other"];
