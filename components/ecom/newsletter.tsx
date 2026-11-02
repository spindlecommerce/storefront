import { Container } from "@/components/ui/container";
import type { NewsletterNode } from "@/lib/builder-components";
import type { NodeProps } from "./context";
import { NewsletterForm } from "./newsletter-form";

export function Newsletter({ node, ctx }: NodeProps<NewsletterNode>) {
  const { title, text, buttonLabel, consent } = node.fields;
  const e = ctx.edit;
  return (
    <section className="py-12 sm:py-16" {...e.node(node)}>
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-brand px-6 py-12 text-white sm:px-12 lg:flex lg:items-center lg:justify-between lg:gap-16 lg:px-16 lg:py-16">
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-white/5" />
          <div className="relative max-w-xl">
            <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl" {...e.text(node.id, "title")}>
              {title}
            </h2>
            {text && (
              <p className="mt-3 text-pretty text-white/80" {...e.text(node.id, "text")}>
                {text}
              </p>
            )}
          </div>
          <div className="relative mt-8 w-full max-w-md lg:mt-0">
            <NewsletterForm
              buttonLabel={buttonLabel || "Subscribe"}
              buttonAttributes={buttonLabel ? e.text(node.id, "buttonLabel") : e.field(node.id, "buttonLabel")}
              consent={consent}
              consentAttributes={e.text(node.id, "consent")}
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
