import type { Translator } from "./i18n/translate";

/**
 * A cart line's problem in the shopper's language. Unknown codes, such as a plugin's, keep the
 * API's English message.
 */
export const lineIssueText = (issue: { code: string; message: string }, available: number | null | undefined, t: Translator) => {
  const { issues } = t.m.cart;
  switch (issue.code) {
    case "UNAVAILABLE":
      return issues.unavailable;
    case "NO_PRICE":
      return issues.noPrice;
    case "OUT_OF_STOCK":
      return issues.outOfStock;
    case "INSUFFICIENT_STOCK":
      return available ? t.p(issues.onlyAvailable, available) : issues.outOfStock;
    default:
      return issue.message;
  }
};
