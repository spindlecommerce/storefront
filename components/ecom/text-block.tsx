import { Markdown } from "@/components/ui/markdown";
import type { TextBlockNode } from "@/lib/builder-components";
import type { NodeProps } from "./context";

export function TextBlock({ node, ctx }: NodeProps<TextBlockNode>) {
  const { content } = node.fields;
  if (!content?.trim() && !ctx.draft) return null;
  return (
    <div {...ctx.edit.node(node)}>
      <Markdown source={content || "_Empty text_"} tone={ctx.tone} attributes={ctx.edit.field(node.id, "content")} />
    </div>
  );
}
