import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

const WIDTHS = { default: "max-w-7xl", wide: "max-w-6xl", normal: "max-w-3xl", narrow: "max-w-2xl" } as const;

/** The page gutter and maximum content width. */
export function Container({ children, width = "default", className }: { children: ReactNode; width?: keyof typeof WIDTHS; className?: string }) {
  return <div className={cx("mx-auto w-full px-4 sm:px-6 lg:px-8", WIDTHS[width], className)}>{children}</div>;
}
