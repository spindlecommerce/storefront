"use client";

import NextLink from "next/link";
import type { ComponentProps } from "react";
import { useLocalize } from "@/components/market-provider";

/**
 * next/link in the page's language: on German pages /cart links to /de/cart. Paths everywhere else
 * are written without a prefix.
 */
export default function Link({ href, ...props }: ComponentProps<typeof NextLink>) {
  const localize = useLocalize();
  return <NextLink href={typeof href === "string" ? localize(href) : href} {...props} />;
}
