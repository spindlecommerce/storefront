import { Container } from "@/components/ui/container";
import type { BuilderCategoryComponentCode, BuilderProductComponentCode } from "@/lib/builder-components";
import type { NodeProps } from "./context";
import { DraftHint } from "./draft-hint";

type DataNode = { id: string; component: BuilderProductComponentCode | BuilderCategoryComponentCode };

/**
 * A product or category component outside a template has no data: visitors see nothing, editors a
 * note.
 */
export function NoTemplateData({ node, ctx, kind }: NodeProps<DataNode> & { kind: "product" | "category" }) {
  if (!ctx.draft) return null;
  return (
    <div className="py-6" {...ctx.edit.node(node)}>
      <Container>
        <DraftHint>
          This component shows a {kind}&apos;s data, so it only renders on {kind} pages: use it in a {kind} template.
        </DraftHint>
      </Container>
    </div>
  );
}
