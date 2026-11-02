import { cx } from "@/lib/cx";

export type ButtonVariant = "primary" | "secondary" | "link";
export type Tone = "light" | "dark";

/** For links and buttons alike. */
export const buttonClass = (variant: ButtonVariant = "primary", tone: Tone = "light", size: "md" | "lg" = "md") => {
  if (variant === "link") {
    return cx(
      "inline-flex items-center gap-1.5 font-semibold underline decoration-2 underline-offset-4 transition-colors",
      tone === "dark" ? "text-white decoration-white/40 hover:decoration-white" : "text-ink decoration-brand/40 hover:decoration-brand",
    );
  }
  return cx(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    size === "lg" ? "h-13 px-7 text-base" : "h-11 px-5 text-sm",
    variant === "primary" && tone === "light" && "bg-brand text-white hover:bg-brand-strong focus-visible:outline-brand",
    variant === "primary" && tone === "dark" && "bg-white text-ink hover:bg-brand-soft focus-visible:outline-white",
    variant === "secondary" && tone === "light" && "border border-stone-300 bg-white/70 text-ink hover:border-ink focus-visible:outline-ink",
    variant === "secondary" && tone === "dark" && "border border-white/40 text-white hover:border-white hover:bg-white/10 focus-visible:outline-white",
  );
};
