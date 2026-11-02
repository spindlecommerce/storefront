import { Container } from "@/components/ui/container";
import type { Product } from "@/lib/types";
import { DescriptionHtml, productDescription, productSpecs, SpecList } from "./product-info";
import { ProductOverview } from "./product-overview";

/** The built-in product page, for products without a template. */
export function ProductView({ product }: { product: Product }) {
  const description = productDescription(product);
  const specs = productSpecs(product);

  return (
    <div className="py-8 sm:py-12">
      <Container>
        <ProductOverview product={product}>
          {(description || specs.length > 0) && (
            <>
              {description && <DescriptionHtml html={description} />}
              {specs.length > 0 && <SpecList specs={specs} className="mt-8" />}
            </>
          )}
        </ProductOverview>
      </Container>
    </div>
  );
}
