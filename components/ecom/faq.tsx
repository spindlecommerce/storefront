import { ChevronDown } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Markdown } from "@/components/ui/markdown";
import type { FaqNode } from "@/lib/builder-components";
import type { NodeProps } from "./context";

/** Native <details>, so answers expand without JavaScript. */
export function Faq({ node, ctx }: NodeProps<FaqNode>) {
  const { title, items } = node.fields;
  const e = ctx.edit;
  if (!items.length && !ctx.draft) return null;
  return (
    <section className="py-12 sm:py-16" {...e.node(node)}>
      <Container width="normal">
        {title && (
          <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl" {...e.text(node.id, "title")}>
            {title}
          </h2>
        )}
        <div className="mt-8 divide-y divide-line border-y border-line" {...e.field(node.id, "items")}>
          {items.map((item) => (
            // Open in draft mode, so editors can click into the answers.
            <details key={item.id} className="group py-5" open={ctx.draft || undefined} {...e.field(node.id, "items", item.id)}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-left font-semibold [&::-webkit-details-marker]:hidden">
                <span {...e.text(node.id, "items", item.id, "question")}>{item.fields.question}</span>
                <ChevronDown aria-hidden className="size-5 shrink-0 text-stone-400 transition-transform group-open:rotate-180" />
              </summary>
              <Markdown source={item.fields.answer} className="mt-3 text-stone-600" attributes={e.field(node.id, "items", item.id, "answer")} />
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
