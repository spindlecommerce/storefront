import type { Product } from "@/lib/types";
import { productGallery } from "./product-overview";

/** `<` is escaped so the JSON cannot close the script tag. */
const jsonLd = (product: Product, url: string) => {
  const prices = product.variants.flatMap((v) => (v.price ? [v.price] : []));
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: productGallery(product).images.map((i) => i.src),
    description: product.seo?.description ?? undefined,
    sku: product.variants[0]?.sku,
    offers: product.variants.map((v) => ({
      "@type": "Offer",
      sku: v.sku,
      url,
      price: v.price?.amount,
      priceCurrency: v.price?.currencyCode ?? prices[0]?.currencyCode,
      availability: v.isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    })),
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
};

/** Rendered by the page, so templates get it too. */
export function ProductJsonLd({ product, url }: { product: Product; url: string }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(product, url) }} />;
}
