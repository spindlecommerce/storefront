import { Container } from "@/components/ui/container";
import { EcomImage } from "@/components/ui/ecom-image";
import { cx } from "@/lib/cx";
import type { HeroNode } from "@/lib/builder-components";
import type { NodeProps } from "./context";

const THEMES = {
  light: { section: "bg-canvas text-ink", soft: "bg-brand-soft", tone: "light", muted: "text-stone-600", eyebrow: "text-brand" },
  dark: { section: "bg-stone-950 text-white", soft: "bg-stone-950", tone: "dark", muted: "text-stone-300", eyebrow: "text-lilac" },
  brand: { section: "bg-brand text-white", soft: "bg-brand", tone: "dark", muted: "text-white/80", eyebrow: "text-white/70" },
} as const;

/** Variations: split (text beside the image), centered, and full_bleed (text over the image). */
export function Hero({ node, ctx }: NodeProps<HeroNode>) {
  const { eyebrow, title, subtitle, image, actions, theme } = node.fields;
  const variation = node.variation ?? "split";
  const e = ctx.edit;
  const t = THEMES[theme ?? "light"];
  // Text over a photo is always set on a dark scrim, except for the light theme's white one.
  const overImage = variation === "full_bleed" && !!image;
  const tone = overImage ? (theme === "light" ? "light" : "dark") : t.tone;
  // A hero near the top is the page's h1, except on product and category pages: there it is the name.
  const Heading = ctx.aboveFold && !ctx.product && !ctx.category ? "h1" : "h2";
  const centered = variation === "centered";

  const text = (
    <div className={cx(centered ? "mx-auto max-w-3xl text-center" : "max-w-2xl")}>
      {eyebrow && (
        <p className={cx("mb-4 text-sm font-semibold uppercase tracking-[0.18em]", overImage ? (tone === "dark" ? "text-white/80" : "text-brand") : t.eyebrow)} {...e.text(node.id, "eyebrow")}>
          {eyebrow}
        </p>
      )}
      <Heading className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl" {...e.text(node.id, "title")}>
        {title}
      </Heading>
      {subtitle && (
        <p className={cx("mt-5 text-pretty text-lg leading-relaxed sm:text-xl", overImage ? (tone === "dark" ? "text-white/85" : "text-stone-700") : t.muted)} {...e.text(node.id, "subtitle")}>
          {subtitle}
        </p>
      )}
      {actions.length > 0 && (
        <div className={cx("mt-8 flex flex-wrap gap-3", centered && "justify-center")} {...e.field(node.id, "actions")}>
          {ctx.renderBlocks(actions, { tone })}
        </div>
      )}
    </div>
  );

  if (variation === "full_bleed") {
    return (
      <section
        className={cx("relative isolate flex min-h-[520px] items-end overflow-hidden sm:min-h-[600px] lg:min-h-[680px]", overImage ? (tone === "dark" ? "text-white" : "text-ink") : t.section)}
        {...e.node(node)}
      >
        {image && (
          <div className="absolute inset-0 -z-10" {...e.field(node.id, "image")}>
            <EcomImage image={image} sizes="100vw" eager={ctx.aboveFold} />
            <div className={cx("absolute inset-0", tone === "dark" ? "bg-linear-to-t from-black/80 via-black/35 to-black/5" : "bg-linear-to-t from-white/95 via-white/60 to-white/0")} />
          </div>
        )}
        <Container className="py-16 sm:py-20 lg:py-24">{text}</Container>
      </section>
    );
  }

  if (centered) {
    return (
      <section className={cx(theme === "light" || !theme ? cx(t.soft, "text-ink") : t.section)} {...e.node(node)}>
        <Container className="py-20 sm:py-24 lg:py-32">{text}</Container>
      </section>
    );
  }

  return (
    <section className={t.section} {...e.node(node)}>
      <Container className="grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-2 lg:gap-16 lg:py-20">
        {text}
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-stone-200 lg:aspect-[5/4]" {...e.field(node.id, "image")}>
          {image ? (
            <EcomImage image={image} sizes="(min-width: 1024px) 50vw, 100vw" eager={ctx.aboveFold} />
          ) : (
            ctx.draft && <span className="absolute inset-0 grid place-items-center text-sm text-stone-500">Choose an image</span>
          )}
        </div>
      </Container>
    </section>
  );
}
