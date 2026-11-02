import { SmartLink } from "@/components/ui/smart-link";
import type { FooterColumnNode } from "@/lib/builder-components";
import type { NodeProps } from "./context";

export function FooterColumn({ node, ctx }: NodeProps<FooterColumnNode>) {
  const { title, links } = node.fields;
  const e = ctx.edit;
  return (
    <div {...e.node(node)}>
      <h2 className="text-sm font-semibold text-white" {...e.text(node.id, "title")}>
        {title}
      </h2>
      <ul className="mt-4 space-y-3" {...e.field(node.id, "links")}>
        {links.map((item) => (
          <li key={item.id} {...e.field(node.id, "links", item.id)}>
            <SmartLink link={item.fields.link} className="text-sm text-stone-400 transition-colors hover:text-white">
              <span {...e.text(node.id, "links", item.id, "label")}>{item.fields.label}</span>
            </SmartLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
