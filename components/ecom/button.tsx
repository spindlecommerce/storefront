import { ArrowRight } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { SmartLink } from "@/components/ui/smart-link";
import type { ButtonNode } from "@/lib/builder-components";
import type { NodeProps } from "./context";

/** A link styled as a button. */
export function Button({ node, ctx }: NodeProps<ButtonNode>) {
  const { label, link, style } = node.fields;
  if (!label && !ctx.draft) return null;
  return (
    <SmartLink link={link} className={buttonClass(style ?? "primary", ctx.tone)} {...ctx.edit.node(node)}>
      <span {...ctx.edit.text(node.id, "label")}>{label || "Button"}</span>
      {style === "link" && <ArrowRight aria-hidden className="size-4" />}
    </SmartLink>
  );
}
