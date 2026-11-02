import Image from "next/image";
import type { EditAttributes } from "@spindlecommerce/storefront-client";
import { imageUrl, isOptimizable } from "@/lib/images";
import { cx } from "@/lib/cx";

type Props = {
  image: { url: string; alt: string | null };
  /** The rendered width, for the optimizer: e.g. "(min-width: 1024px) 50vw, 100vw". */
  sizes: string;
  className?: string;
  /** Above-the-fold images load eagerly with high priority. */
  eager?: boolean;
  fit?: "cover" | "contain";
  attributes?: EditAttributes;
};

/** Fills its positioned parent. Only hosts in lib/images.ts go through the optimizer. */
export function EcomImage({ image, sizes, className, eager, fit = "cover", attributes }: Props) {
  const src = imageUrl(image.url);
  return (
    <Image
      src={src}
      alt={image.alt ?? ""}
      fill
      sizes={sizes}
      unoptimized={!isOptimizable(src)}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      className={cx(fit === "cover" ? "object-cover" : "object-contain", className)}
      {...attributes}
    />
  );
}
