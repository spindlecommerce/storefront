import { Container } from "@/components/ui/container";
import { EcomImage } from "@/components/ui/ecom-image";
import { Markdown } from "@/components/ui/markdown";
import { cx } from "@/lib/cx";
import type { ImageWithTextNode } from "@/lib/builder-components";
import type { NodeProps } from "./context";

export function ImageWithText({ node, ctx }: NodeProps<ImageWithTextNode>) {
  const { image, title, body, actions, imagePosition } = node.fields;
  const e = ctx.edit;
  return (
    <section className="py-12 sm:py-16 lg:py-20" {...e.node(node)}>
      <Container className="grid items-center gap-10 md:grid-cols-2 lg:gap-20">
        <div className={cx("relative aspect-[4/3] overflow-hidden rounded-3xl bg-stone-200", imagePosition === "right" && "md:order-2")} {...e.field(node.id, "image")}>
          {image ? (
            <EcomImage image={image} sizes="(min-width: 768px) 50vw, 100vw" eager={ctx.aboveFold} />
          ) : (
            ctx.draft && <span className="absolute inset-0 grid place-items-center text-sm text-stone-500">Choose an image</span>
          )}
        </div>
        <div className="max-w-xl">
          {title && (
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl" {...e.text(node.id, "title")}>
              {title}
            </h2>
          )}
          <Markdown source={body} className="mt-5 text-lg text-stone-600" attributes={e.field(node.id, "body")} />
          {actions.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-3" {...e.field(node.id, "actions")}>
              {ctx.renderBlocks(actions)}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
