import Link from "@/components/ui/link";
import { createRenderContext } from "@/components/ecom/registry";
import { Container } from "@/components/ui/container";
import type { SiteFooterNode } from "@/lib/builder-components";
import { getT } from "@/lib/market";
import type { BuilderPage } from "@/lib/types";
import { Logo } from "./logo";

/** The site_footer singleton. */
export async function SiteFooter({ footer, draft }: { footer: BuilderPage<SiteFooterNode> | null; draft: boolean }) {
  const { m } = await getT();
  const ctx = createRenderContext(footer ?? { references: { products: [], categories: [], pages: [] } }, draft, "dark");
  const e = ctx.edit;
  const root = footer?.content ?? null;
  const rootId = root?.id ?? "root";
  const columns = root?.fields.columns ?? [];
  return (
    <footer key={draft ? footer?.updatedAt : undefined} className="bg-stone-950 text-stone-300" {...(footer ? e.document(footer.id) : {})}>
      <div {...(root ? e.node(root) : {})}>
        <Container className="grid gap-12 py-14 lg:grid-cols-[1fr_2fr] lg:py-20">
          <div>
            <Link href="/" className="inline-block rounded-lg text-white" aria-label={m.site.home}>
              <Logo tone="dark" />
            </Link>
            {root?.fields.tagline && (
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-stone-400" {...e.text(rootId, "tagline")}>
                {root.fields.tagline}
              </p>
            )}
          </div>
          {columns.length > 0 && (
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3" {...e.field(rootId, "columns")}>
              {ctx.renderBlocks(columns)}
            </div>
          )}
        </Container>
        <div className="border-t border-white/10">
          <Container className="flex flex-col gap-2 py-6 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between">
            {root?.fields.legal ? <p {...e.text(rootId, "legal")}>{root.fields.legal}</p> : <p>© SpindleCommerce</p>}
            <p>{m.site.sampleNote}</p>
          </Container>
        </div>
      </div>
    </footer>
  );
}
