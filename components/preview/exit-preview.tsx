import type { ReactNode } from "react";

/** A form rather than a link, so it is never prefetched. */
export function ExitPreviewForm({ path, className, children }: { path: string; className?: string; children: ReactNode }) {
  return (
    <form action="/api/draft/disable" method="post" className="contents">
      <input type="hidden" name="path" value={path} />
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}
