import { de } from "./de";
import { en } from "./en";
import { fr } from "./fr";
import { translator, type Messages } from "./translate";

/**
 * The storefront's own text; content comes translated from the API. Messages are plain strings and
 * plural forms, so client components can receive them as props.
 */
export { format, rich, translator, type Messages, type Plural, type Translator } from "./translate";

const MESSAGES: Record<string, Messages> = { en, de, fr };

/** English when the storefront has none for the locale's language. */
export const messagesFor = (locale: string): Messages => MESSAGES[locale.split("-")[0]!.toLowerCase()] ?? en;

export const translatorFor = (locale: string) => translator(locale, messagesFor(locale));
