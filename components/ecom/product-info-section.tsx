import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { cx } from "@/lib/cx";
import type { EditAttributes } from "@spindlecommerce/storefront-client";

type Props = {
  title: string | null;
  titleAttributes: EditAttributes;
  attributes: EditAttributes;
  children: ReactNode;
};

export function ProductInfoSection({ title, titleAttributes, attributes, children }: Props) {
  return (
    <section className="py-8 sm:py-10" {...attributes}>
      <Container>
        <div className="grid gap-6 border-t border-line pt-8 sm:pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
          {title && (
            <h2 className="text-balance text-xl font-semibold tracking-tight sm:text-2xl" {...titleAttributes}>
              {title}
            </h2>
          )}
          <div className={cx("max-w-2xl", !title && "lg:col-start-2")}>{children}</div>
        </div>
      </Container>
    </section>
  );
}
