import { ArrowUpRight } from "lucide-react";
import Link from "@/components/ui/link";
import { Container } from "@/components/ui/container";
import { EcomImage } from "@/components/ui/ecom-image";
import { cx } from "@/lib/cx";
import type { CategoryTilesNode } from "@/lib/builder-components";
import { categoryPath } from "@/lib/paths";
import type { NodeProps } from "./context";

export function CategoryTiles({ node, ctx }: NodeProps<CategoryTilesNode>) {
  const { title, tiles } = node.fields;
  const e = ctx.edit;
  // Tiles whose category is not visible in this channel are left out (editors still see them).
  const shown = tiles.flatMap((tile) => {
    const category = tile.fields.category ? ctx.categories.get(tile.fields.category) : undefined;
    return category || ctx.draft ? [{ tile, category }] : [];
  });
  if (!shown.length) return null;
  return (
    <section className="py-12 sm:py-16" {...e.node(node)}>
      <Container>
        {title && (
          <h2 className="mb-8 text-balance text-2xl font-semibold tracking-tight sm:text-3xl" {...e.text(node.id, "title")}>
            {title}
          </h2>
        )}
        <ul className={cx("grid grid-cols-2 gap-4 sm:gap-6", shown.length === 3 && "lg:grid-cols-3", shown.length >= 4 && "lg:grid-cols-4")} {...e.field(node.id, "tiles")}>
          {shown.map(({ tile, category }) => {
            const label = tile.fields.label || category?.name || "Choose a category";
            const body = (
              <>
                {tile.fields.image && (
                  <EcomImage image={{ url: tile.fields.image.url, alt: tile.fields.image.alt }} sizes="(min-width: 1024px) 25vw, 50vw" className="transition duration-700 ease-out group-hover:scale-105" />
                )}
                <span aria-hidden className="absolute inset-0 bg-linear-to-t from-black/65 via-black/10 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-4 text-white sm:p-5">
                  <span className="text-base font-semibold sm:text-lg" {...(tile.fields.label ? e.text(node.id, "tiles", tile.id, "label") : e.field(node.id, "tiles", tile.id, "label"))}>
                    {label}
                  </span>
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur transition group-hover:bg-white group-hover:text-ink">
                    <ArrowUpRight aria-hidden className="size-4" />
                  </span>
                </span>
              </>
            );
            const tileClass = "group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-stone-300";
            return (
              <li key={tile.id} {...e.field(node.id, "tiles", tile.id)}>
                {category ? (
                  <Link href={categoryPath(category.path)} className={tileClass}>
                    {body}
                  </Link>
                ) : (
                  <div className={tileClass}>{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
