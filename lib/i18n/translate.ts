import type { en } from "./en";

/** Message formatting for server and client code. The dictionaries load only on the server. */
export type Messages = typeof en;
export type Plural = { one: string; other: string };
type Values = Record<string, string | number>;

/** A template with its {placeholders} filled. */
export const format = (template: string, values: Values = {}) => template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));

/** Like format, but values may be React elements: returns the parts, to render as children. */
export const rich = <T>(template: string, values: Record<string, T>): (string | T)[] =>
  template.split(/\{(\w+)\}/).map((part, i) => (i % 2 === 0 ? part : (values[part] ?? `{${part}}`)));

export type Translator = {
  locale: string;
  m: Messages;
  /** A template with its {placeholders} filled. */
  f: (template: string, values?: Values) => string;
  /** The plural form for `count`, with {count} and other placeholders filled. */
  p: (forms: Plural, count: number, values?: Values) => string;
  /** Items as a list in a sentence: "a, b and c". */
  list: (items: string[]) => string;
};

export const translator = (locale: string, m: Messages): Translator => {
  const rules = new Intl.PluralRules(locale);
  const number = new Intl.NumberFormat(locale);
  const list = new Intl.ListFormat(locale, { type: "conjunction" });
  return {
    locale,
    m,
    f: format,
    p: (forms, count, values = {}) => format(rules.select(count) === "one" ? forms.one : forms.other, { count: number.format(count), ...values }),
    list: (items) => list.format(items),
  };
};
