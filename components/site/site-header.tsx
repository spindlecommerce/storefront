import Link from "@/components/ui/link";
import { Container } from "@/components/ui/container";
import { SmartLink } from "@/components/ui/smart-link";
import { cx } from "@/lib/cx";
import type { SiteHeaderNode } from "@/lib/builder-components";
import type { BuilderPage } from "@/lib/types";
import { getT } from "@/lib/market";
import { editable } from "@spindlecommerce/storefront-client";
import { CartLink } from "./cart-link";
import { Logo } from "./logo";
import { MarketPicker } from "./market-picker";
import { MobileNav, type NavItem } from "./mobile-nav";

/** The site_header singleton. The announcement bar scrolls away; the navigation stays. */
export async function SiteHeader({ header, draft }: { header: BuilderPage<SiteHeaderNode> | null; draft: boolean }) {
  const { m } = await getT();
  const e = editable(draft);
  const root = header?.content ?? null;
  const rootId = root?.id ?? "root";
  const announcement = root?.fields.announcement;
  const navigation = root?.fields.navigation ?? [];
  const items: NavItem[] = navigation.map((item) => ({
    id: item.id,
    label: item.fields.label ?? "",
    href: item.fields.link?.href ?? null,
    newTab: item.fields.link?.newTab ?? false,
    highlight: item.fields.highlight,
    itemAttributes: e.field(rootId, "navigation", item.id),
    labelAttributes: e.text(rootId, "navigation", item.id, "label"),
  }));

  return (
    <header key={draft ? header?.updatedAt : undefined} className={cx("sticky z-40", announcement ? "-top-9" : "top-0")} {...(header ? e.document(header.id) : {})}>
      <div {...(root ? e.node(root) : {})}>
        {announcement && (
          <div className="flex h-9 items-center justify-center bg-ink px-4 text-xs font-medium text-white sm:text-[13px]">
            <SmartLink link={root?.fields.announcementLink} className="truncate underline-offset-4 hover:underline" {...e.field(rootId, "announcementLink")}>
              <span {...e.text(rootId, "announcement")}>{announcement}</span>
            </SmartLink>
          </div>
        )}
        <div className="relative border-b border-line bg-canvas/90 backdrop-blur-md">
          <Container className="flex h-16 items-center gap-4 lg:gap-8">
            <MobileNav items={items} />
            <Link href="/" className="rounded-lg" aria-label={m.site.home}>
              <Logo />
            </Link>
            {items.length > 0 && (
              <nav aria-label={m.site.mainNavigation} className="hidden lg:block" {...e.field(rootId, "navigation")}>
                <ul className="flex items-center gap-1">
                  {navigation.map((item, i) => (
                    <li key={item.id} {...items[i]?.itemAttributes}>
                      <SmartLink
                        link={item.fields.link}
                        className={cx(
                          "rounded-full px-3 py-2 text-sm font-medium transition-colors",
                          item.fields.highlight ? "text-ember hover:bg-accent-soft" : "text-stone-700 hover:bg-stone-200/60 hover:text-ink",
                        )}
                      >
                        <span {...items[i]?.labelAttributes}>{item.fields.label}</span>
                      </SmartLink>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
            <div className="ml-auto flex items-center gap-1">
              <MarketPicker />
              <CartLink />
            </div>
          </Container>
        </div>
      </div>
    </header>
  );
}
