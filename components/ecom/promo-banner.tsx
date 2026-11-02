import { ArrowRight } from "lucide-react";
import { SmartLink } from "@/components/ui/smart-link";
import { Container } from "@/components/ui/container";
import { cx } from "@/lib/cx";
import { getT } from "@/lib/market";
import type { PromoBannerNode } from "@/lib/builder-components";
import type { NodeProps } from "./context";

const TONES = {
  sale: { bar: "bg-accent text-ink", code: "bg-white/40" },
  info: { bar: "bg-brand-soft text-brand-strong", code: "bg-brand/10" },
  dark: { bar: "bg-ink text-white", code: "bg-white/15" },
} as const;

export async function PromoBanner({ node, ctx }: NodeProps<PromoBannerNode>) {
  const { text, code, link, tone } = node.fields;
  if (!text && !ctx.draft) return null;
  const { m } = await getT();
  const t = TONES[tone ?? "sale"];
  const e = ctx.edit;
  return (
    <section className={t.bar} {...e.node(node)}>
      <Container className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 py-3 text-center text-sm">
        <SmartLink link={link} className={cx("inline-flex items-center gap-1.5 font-medium", link?.href && "underline-offset-4 hover:underline")} {...e.field(node.id, "link")}>
          <span {...e.text(node.id, "text")}>{text}</span>
          {link?.href && <ArrowRight aria-hidden className="size-4 shrink-0" />}
        </SmartLink>
        {code && (
          <span className="inline-flex items-center gap-2">
            <span className="opacity-80">{m.blocks.useCode}</span>
            <code className={cx("rounded-md px-2 py-0.5 font-mono text-[13px] font-semibold tracking-wider", t.code)} {...e.text(node.id, "code")}>
              {code}
            </code>
          </span>
        )}
      </Container>
    </section>
  );
}
