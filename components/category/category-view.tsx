import { Container } from "@/components/ui/container";
import type { Category, SearchParams } from "@/lib/types";
import { CategoryHeading } from "./category-heading";
import { CategoryListing } from "./category-listing";
import { SubcategoryLinks } from "./subcategory-links";

/** The built-in category page, for categories without a template. */
export function CategoryView({ category, searchParams }: { category: Category; searchParams: SearchParams }) {
  return (
    <div className="py-8 sm:py-12">
      <Container>
        <CategoryHeading category={category} />
        {category.children.length > 0 && <SubcategoryLinks categories={category.children} className="mt-8" />}
        <CategoryListing category={category} searchParams={searchParams} className="mt-10" />
      </Container>
    </div>
  );
}
