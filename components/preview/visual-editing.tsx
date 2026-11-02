"use client";

import { VisualEditing as Bridge } from "@spindlecommerce/storefront-next/client";
import { useLocalize } from "@/components/market-provider";

/** The admin names pages by their paths without a language: they open in this page's. */
export function VisualEditing({ adminOrigin, bridgeUrl }: { adminOrigin: string; bridgeUrl: string }) {
  const localize = useLocalize();
  return <Bridge adminOrigin={adminOrigin} bridgeUrl={bridgeUrl} localize={localize} />;
}
