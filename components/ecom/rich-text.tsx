import { Container } from "@/components/ui/container";
import { Markdown } from "@/components/ui/markdown";
import { cx } from "@/lib/cx";
import type { RichTextNode } from "@/lib/builder-components";
import type { NodeProps } from "./context";
import { DraftHint } from "./draft-hint";

const WIDTHS = { narrow: "narrow", normal: "normal", wide: "wide" } as const;

export function RichText({ node, ctx }: NodeProps<RichTextNode>) {
  const { content, width, align } = node.fields;
  if (!content?.trim() && !ctx.draft) return null;
  return (
    <section className="py-10 sm:py-14" {...ctx.edit.node(node)}>
      <Container width={WIDTHS[width ?? "normal"]}>
        {content?.trim() ? (
          <Markdown source={content} className={cx("text-lg", align === "center" && "text-center")} attributes={ctx.edit.field(node.id, "content")} />
        ) : (
          <DraftHint>Add some text to this section.</DraftHint>
        )}
      </Container>
    </section>
  );
}
