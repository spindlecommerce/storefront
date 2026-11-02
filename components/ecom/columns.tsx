import { Container } from "@/components/ui/container";
import { cx } from "@/lib/cx";
import type { ColumnNode, ColumnsNode } from "@/lib/builder-components";
import type { NodeProps } from "./context";
import { DraftHint } from "./draft-hint";

const GAPS = { small: "gap-4", medium: "gap-8", large: "gap-12 lg:gap-16" } as const;
const GRID: Record<number, string> = { 1: "", 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" };

export function Columns({ node, ctx }: NodeProps<ColumnsNode>) {
  const { columns, gap } = node.fields;
  if (!columns.length && !ctx.draft) return null;
  return (
    <section className="py-12 sm:py-16" {...ctx.edit.node(node)}>
      <Container>
        <div className={cx("grid", GAPS[gap ?? "medium"], GRID[Math.min(columns.length, 4)])} {...ctx.edit.field(node.id, "columns")}>
          {columns.length ? ctx.renderBlocks(columns) : <DraftHint>Add columns.</DraftHint>}
        </div>
      </Container>
    </section>
  );
}

export function Column({ node, ctx }: NodeProps<ColumnNode>) {
  const { content } = node.fields;
  return (
    <div className="flex flex-col items-start gap-5" {...ctx.edit.node(node)}>
      {content.length ? ctx.renderBlocks(content) : ctx.draft && <DraftHint>Empty column</DraftHint>}
    </div>
  );
}
