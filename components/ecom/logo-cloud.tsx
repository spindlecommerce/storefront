import { Container } from "@/components/ui/container";
import { EcomImage } from "@/components/ui/ecom-image";
import { SmartLink } from "@/components/ui/smart-link";
import type { LogoCloudNode } from "@/lib/builder-components";
import type { NodeProps } from "./context";

export function LogoCloud({ node, ctx }: NodeProps<LogoCloudNode>) {
  const { title, logos } = node.fields;
  const e = ctx.edit;
  const shown = logos.filter((logo) => logo.fields.image || ctx.draft);
  if (!shown.length && !ctx.draft) return null;
  return (
    <section className="py-10 sm:py-14" {...e.node(node)}>
      <Container>
        {title && (
          <h2 className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-stone-500" {...e.text(node.id, "title")}>
            {title}
          </h2>
        )}
        <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-8" {...e.field(node.id, "logos")}>
          {shown.map((logo) => (
            <li key={logo.id} {...e.field(node.id, "logos", logo.id)}>
              <SmartLink link={logo.fields.link} className="block" aria-label={logo.fields.name ?? undefined}>
                <span className="relative block h-10 w-32 opacity-60 grayscale transition hover:opacity-100 hover:grayscale-0">
                  {logo.fields.image ? (
                    <EcomImage image={{ url: logo.fields.image.url, alt: logo.fields.name ?? logo.fields.image.alt }} sizes="128px" fit="contain" />
                  ) : (
                    <span className="absolute inset-0 grid place-items-center text-sm font-semibold text-stone-500">{logo.fields.name}</span>
                  )}
                </span>
              </SmartLink>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
