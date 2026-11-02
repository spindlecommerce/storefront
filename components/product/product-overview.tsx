import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "@/components/ui/breadcrumbs";
import { imageUrl, isOptimizable } from "@/lib/images";
import { getT } from "@/lib/market";
import { categoryPath } from "@/lib/paths";
import type { Product } from "@/lib/types";
import { ProductPurchase, type GalleryImage } from "./product-purchase";

export const deepestCategory = (product: Pick<Product, "categories">) => [...product.categories].sort((a, b) => b.path.split("/").length - a.path.split("/").length)[0];

/** Home › the product's deepest category › the product. */
export const productCrumbs = (product: Pick<Product, "name" | "categories">, home: string): Crumb[] => {
  const category = deepestCategory(product);
  return [{ label: home, href: "/" }, ...(category ? [{ label: category.name, href: categoryPath(category.path) }] : []), { label: product.name }];
};

/** The product's photos in order, and which of them shows each variant. */
export const productGallery = (product: Pick<Product, "name" | "media" | "variants">) => {
  const media = product.media.filter((m) => m.kind === "IMAGE").sort((a, b) => a.position - b.position);
  const images: GalleryImage[] = media.map((m) => ({ id: m.id, src: imageUrl(m.url), optimize: isOptimizable(m.url), alt: m.alt || product.name }));
  const variantImage = Object.fromEntries(
    product.variants.flatMap((v) => {
      const own = v.media[0]?.url;
      const index = own ? media.findIndex((m) => m.url === own) : media.findIndex((m) => m.variant?.id === v.id);
      return index >= 0 ? [[v.id, index] as const] : [];
    }),
  );
  return { images, variantImage };
};

type Props = {
  product: Product;
  breadcrumbs?: boolean;
  galleryPosition?: "left" | "right";
  /** A line right under the add to cart button. */
  note?: ReactNode;
  children?: ReactNode;
};

export async function ProductOverview({ product, breadcrumbs = true, galleryPosition = "left", note, children }: Props) {
  const { m } = await getT();
  const { images, variantImage } = productGallery(product);
  return (
    <>
      {breadcrumbs && <Breadcrumbs items={productCrumbs(product, m.site.home)} />}
      <div className={breadcrumbs ? "mt-6 sm:mt-8" : undefined}>
        <ProductPurchase
          key={product.id}
          name={product.name}
          options={product.options}
          variants={product.variants}
          priceRange={product.priceRange}
          images={images}
          variantImage={variantImage}
          galleryPosition={galleryPosition}
          note={note}
        >
          {children}
        </ProductPurchase>
      </div>
    </>
  );
}
