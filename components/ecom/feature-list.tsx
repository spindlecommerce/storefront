import { Clock, Gift, Heart, Leaf, RefreshCw, ShieldCheck, Star, Truck, type LucideIcon } from "lucide-react";
import { Container } from "@/components/ui/container";
import { cx } from "@/lib/cx";
import type { FeatureListNode } from "@/lib/builder-components";
import type { NodeProps } from "./context";

const ICONS: Record<string, LucideIcon> = { truck: Truck, refresh: RefreshCw, shield: ShieldCheck, leaf: Leaf, star: Star, gift: Gift, heart: Heart, clock: Clock };
const COLUMNS = { "2": "sm:grid-cols-2", "3": "sm:grid-cols-2 lg:grid-cols-3", "4": "sm:grid-cols-2 lg:grid-cols-4" } as const;

export function FeatureList({ node, ctx }: NodeProps<FeatureListNode>) {
  const { title, intro, features, columns } = node.fields;
  const e = ctx.edit;
  return (
    <section className="border-y border-line bg-white py-12 sm:py-16" {...e.node(node)}>
      <Container>
        {(title || intro) && (
          <div className="mx-auto mb-10 max-w-2xl text-center">
            {title && (
              <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl" {...e.text(node.id, "title")}>
                {title}
              </h2>
            )}
            {intro && (
              <p className="mt-3 text-pretty text-stone-600" {...e.text(node.id, "intro")}>
                {intro}
              </p>
            )}
          </div>
        )}
        <ul className={cx("grid gap-x-8 gap-y-10", COLUMNS[columns ?? "3"])} {...e.field(node.id, "features")}>
          {features.map((feature) => {
            const Icon = ICONS[feature.fields.icon ?? "star"] ?? Star;
            return (
              <li key={feature.id} className="flex gap-4" {...e.field(node.id, "features", feature.id)}>
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand" {...e.field(node.id, "features", feature.id, "icon")}>
                  <Icon aria-hidden className="size-5" strokeWidth={1.75} />
                </span>
                <div>
                  <h3 className="font-semibold" {...e.text(node.id, "features", feature.id, "title")}>
                    {feature.fields.title}
                  </h3>
                  {feature.fields.text && (
                    <p className="mt-1 text-sm leading-relaxed text-stone-600" {...e.text(node.id, "features", feature.id, "text")}>
                      {feature.fields.text}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
