"use client";

import type { ComponentProps } from "react";
import { useMarket } from "@/components/market-provider";
import { localizeLinks } from "@/lib/locale-path";

/** `html` must already be safe: rendered Markdown or a sanitized description. */
export function RichHtml({ html, ...props }: { html: string } & Omit<ComponentProps<"div">, "children" | "dangerouslySetInnerHTML">) {
  const { prefix } = useMarket().current;
  return <div {...props} dangerouslySetInnerHTML={{ __html: localizeLinks(html, prefix) }} />;
}
