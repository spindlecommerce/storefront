"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { ExitPreviewForm } from "./exit-preview";

const noSubscription = () => () => {};
const isFramed = () => window.parent !== window;

/** Shown when a draft is opened directly rather than in the admin's editor. */
export function PreviewBadge() {
  // The server cannot know; assume framed so nothing flashes inside the editor.
  const framed = useSyncExternalStore(noSubscription, isFramed, () => true);
  const pathname = usePathname();
  if (framed) return null;
  return (
    <div role="status" className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full bg-ink py-1.5 pl-4 pr-1.5 text-sm text-white shadow-xl ring-1 ring-white/10">
      <span aria-hidden className="size-2 rounded-full bg-amber-400" />
      <span className="font-medium">Preview mode</span>
      <span aria-hidden className="text-white/40">
        ·
      </span>
      <ExitPreviewForm path={pathname} className="rounded-full bg-white/10 px-3 py-1 font-semibold transition-colors hover:bg-white/20">
        Exit
      </ExitPreviewForm>
    </div>
  );
}
