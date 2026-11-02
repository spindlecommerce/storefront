import { Container } from "@/components/ui/container";
import type { ContentNode, NodeProps } from "./context";

export function UnknownComponent({ node, ctx }: NodeProps<ContentNode>) {
  if (!ctx.draft) return null;
  return (
    <div className="py-6" {...ctx.edit.node(node)}>
      <Container>
        <div className="rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50 p-6 text-sm text-amber-900">
          <p className="font-semibold">
            Unknown component: <code className="font-mono">{node.component}</code>
          </p>
          <p className="mt-1 text-amber-800">
            The storefront has no React component for this code yet, so visitors see nothing here. Add one under components/ecom and register it in
            components/ecom/registry.tsx.
          </p>
        </div>
      </Container>
    </div>
  );
}
