import Link from "@/components/ui/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { BuilderLink } from "@/lib/builder-components";

type Props = Omit<ComponentPropsWithoutRef<"a">, "href"> & { link: BuilderLink | null | undefined; children: ReactNode; prefetch?: boolean };

const isExternal = (href: string) => /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("//");

/**
 * A link from content. `href` is null when the target is unpublished; the children then render as
 * plain text.
 */
export function SmartLink({ link, children, prefetch, className, style, ...rest }: Props) {
  const href = link?.href;
  if (!href) {
    // Keep data-* (visual editing) and aria-* attributes on the text.
    const kept = Object.fromEntries(Object.entries(rest).filter(([key]) => key.startsWith("data-") || key.startsWith("aria-")));
    return (
      <span className={className} style={style} {...kept}>
        {children}
      </span>
    );
  }
  const newTab = link.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {};
  if (isExternal(href) || href.startsWith("#")) {
    return (
      <a href={href} className={className} style={style} {...newTab} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} prefetch={prefetch} className={className} style={style} {...newTab} {...rest}>
      {children}
    </Link>
  );
}
