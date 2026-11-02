import { imageUrl, isOptimizable } from "@/lib/images";
import type { ProductSummary } from "@/lib/types";
import { ProductCardBody, type CardPhoto } from "./product-card-body";

/** Photo URLs resolve here: only the server knows the API's address. */
export function ProductCard({ product, showPrice = true, sizes, eager }: { product: ProductSummary; showPrice?: boolean; sizes: string; eager?: boolean }) {
  const photos = product.media.flatMap((m): CardPhoto[] =>
    m.kind === "IMAGE" ? [{ src: imageUrl(m.url), optimize: isOptimizable(m.url), alt: m.alt || product.name, variantId: m.variant?.id ?? null }] : [],
  );
  return (
    <ProductCardBody
      name={product.name}
      slug={product.slug}
      isAvailable={product.isAvailable}
      priceRange={product.priceRange}
      options={product.options}
      variants={product.variants}
      photos={photos}
      showPrice={showPrice}
      sizes={sizes}
      eager={eager}
    />
  );
}
