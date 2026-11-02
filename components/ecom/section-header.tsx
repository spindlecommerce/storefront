import { ArrowRight } from "lucide-react";
import { SmartLink } from "@/components/ui/smart-link";
import type { BuilderLink } from "@/lib/builder-components";
import type { EditAttributes } from "@spindlecommerce/storefront-client";

export function SectionHeader({ title, titleAttributes, link, linkAttributes }: { title: string | null; titleAttributes: EditAttributes; link?: BuilderLink | null; linkAttributes?: EditAttributes }) {
  if (!title && !link?.href) return null;
  return (
    <div className="mb-8 flex items-end justify-between gap-6">
      {title ? (
        <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl" {...titleAttributes}>
          {title}
        </h2>
      ) : (
        <span />
      )}
      {link?.href && (
        <SmartLink link={link} className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-strong" {...linkAttributes}>
          View all
          <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
        </SmartLink>
      )}
    </div>
  );
}
