import { EcomImage } from "@/components/ui/ecom-image";
import { SmartLink } from "@/components/ui/smart-link";
import type { ImageBlockNode } from "@/lib/builder-components";
import type { NodeProps } from "./context";

export function ImageBlock({ node, ctx }: NodeProps<ImageBlockNode>) {
  const { image, caption, link } = node.fields;
  if (!image && !ctx.draft) return null;
  const ratio = image?.width && image.height ? `${image.width} / ${image.height}` : "4 / 3";
  return (
    <figure {...ctx.edit.node(node)}>
      <SmartLink link={link} className="relative block overflow-hidden rounded-2xl bg-stone-200" style={{ aspectRatio: ratio }} {...ctx.edit.field(node.id, "image")}>
        {image ? <EcomImage image={image} sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" /> : <span className="absolute inset-0 grid place-items-center text-sm text-stone-500">Choose an image</span>}
      </SmartLink>
      {caption && (
        <figcaption className="mt-3 text-sm text-stone-500" {...ctx.edit.text(node.id, "caption")}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
