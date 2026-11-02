"use client";

import { ShoppingBag } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { cx } from "@/lib/cx";

type Props = {
  /** Absolute URL, or null when the product has no image. */
  src: string | null;
  /** Decided on the server with isOptimizable (lib/images.ts). */
  optimize: boolean;
  alt: string;
  /** Shown on the placeholder. */
  name: string;
  sizes: string;
  eager?: boolean;
  className?: string;
};

/** Shows a placeholder when there is no photo or it fails to load. */
export function ProductImage({ src, optimize, alt, name, sizes, eager, className }: Props) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!src || failed === src) {
    return (
      <div
        {...(alt ? { role: "img", "aria-label": alt } : { "aria-hidden": true })}
        className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-linear-to-br from-stone-100 to-stone-200 p-6 text-stone-400"
      >
        <ShoppingBag aria-hidden className="size-9" strokeWidth={1.25} />
        <span aria-hidden className="line-clamp-2 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500">
          {name}
        </span>
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      unoptimized={!optimize}
      loading={eager ? "eager" : "lazy"}
      onError={() => setFailed(src)}
      className={cx("object-cover", className)}
    />
  );
}
