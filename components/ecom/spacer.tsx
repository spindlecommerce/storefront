import { Container } from "@/components/ui/container";
import { cx } from "@/lib/cx";
import type { SpacerNode } from "@/lib/builder-components";
import type { NodeProps } from "./context";

const SIZES = { small: "h-6 sm:h-8", medium: "h-12 sm:h-16", large: "h-20 sm:h-28" } as const;

export function Spacer({ node, ctx }: NodeProps<SpacerNode>) {
  const { size, divider } = node.fields;
  return (
    <div className={cx("flex items-center", SIZES[size ?? "medium"])} aria-hidden="true" {...ctx.edit.node(node)}>
      {divider && (
        <Container>
          <hr className="border-line" />
        </Container>
      )}
    </div>
  );
}
