import { cx } from "@/lib/cx";
import { renderMarkdown } from "@/lib/markdown";
import type { EditAttributes } from "@spindlecommerce/storefront-client";
import { RichHtml } from "./rich-html";

/** Raw HTML in the source is escaped. */
export function Markdown({ source, className, tone = "light", attributes }: { source: string | null | undefined; className?: string; tone?: "light" | "dark"; attributes?: EditAttributes }) {
  if (!source?.trim()) return null;
  return <RichHtml className={cx("rich-text", tone === "dark" && "rich-text-invert", className)} {...attributes} html={renderMarkdown(source)} />;
}
