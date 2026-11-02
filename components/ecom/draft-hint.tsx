import type { ReactNode } from "react";

/** A note for editors: callers render it only in draft mode. */
export function DraftHint({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50/80 px-5 py-6 text-center text-sm text-stone-500">{children}</div>;
}
