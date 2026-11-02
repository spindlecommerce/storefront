"use client";

import { useCartCount } from "@spindlecommerce/storefront-next/client";
import { ShoppingBag } from "lucide-react";
import { useT } from "@/components/market-provider";
import Link from "@/components/ui/link";

export function CartLink() {
  const t = useT();
  const count = useCartCount();
  return (
    <Link
      href="/cart"
      prefetch={false}
      className="relative inline-flex size-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-stone-200/60"
      aria-label={count ? t.p(t.m.site.cartItems, count) : t.m.site.cart}
    >
      <ShoppingBag aria-hidden className="size-5" strokeWidth={1.75} />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold tabular-nums text-ink">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
