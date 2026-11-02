import { Quote } from "lucide-react";
import { Container } from "@/components/ui/container";
import { EcomImage } from "@/components/ui/ecom-image";
import { cx } from "@/lib/cx";
import type { TestimonialsNode } from "@/lib/builder-components";
import type { NodeProps } from "./context";

const initials = (name: string | null) =>
  (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

export function Testimonials({ node, ctx }: NodeProps<TestimonialsNode>) {
  const { title, quotes } = node.fields;
  const e = ctx.edit;
  if (!quotes.length && !ctx.draft) return null;
  return (
    <section className="py-12 sm:py-16 lg:py-20" {...e.node(node)}>
      <Container>
        {title && (
          <h2 className="text-balance text-center text-2xl font-semibold tracking-tight sm:text-3xl" {...e.text(node.id, "title")}>
            {title}
          </h2>
        )}
        <ul className={cx("mt-10 grid gap-6 md:grid-cols-2", quotes.length >= 3 && "lg:grid-cols-3")} {...e.field(node.id, "quotes")}>
          {quotes.map((item) => {
            const { quote, author, role, avatar } = item.fields;
            return (
              <li key={item.id} {...e.field(node.id, "quotes", item.id)}>
                <figure className="flex h-full flex-col rounded-3xl bg-white p-8 shadow-sm ring-1 ring-line">
                  <Quote aria-hidden className="size-8 text-brand/25" fill="currentColor" strokeWidth={0} />
                  <blockquote className="mt-4 flex-1 text-pretty text-lg leading-relaxed text-ink" {...e.text(node.id, "quotes", item.id, "quote")}>
                    {quote}
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3">
                    <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-soft text-sm font-semibold text-brand" {...e.field(node.id, "quotes", item.id, "avatar")}>
                      {avatar ? <EcomImage image={{ url: avatar.url, alt: avatar.alt ?? author }} sizes="44px" /> : initials(author)}
                    </span>
                    <span>
                      <span className="block font-semibold" {...e.text(node.id, "quotes", item.id, "author")}>
                        {author}
                      </span>
                      {role && (
                        <span className="block text-sm text-stone-500" {...e.text(node.id, "quotes", item.id, "role")}>
                          {role}
                        </span>
                      )}
                    </span>
                  </figcaption>
                </figure>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
