import { Clock } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ExitPreviewForm } from "./exit-preview";

/** Draft mode is on, but the API no longer accepts the preview token. */
export function PreviewExpired({ path }: { path: string }) {
  return (
    <Container width="narrow" className="py-24 text-center sm:py-32">
      <span className="inline-flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <Clock aria-hidden className="size-6" />
      </span>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Preview expired</h1>
      <p className="mt-3 text-pretty text-stone-600">
        This preview link has expired or is no longer valid. Open the page again from the admin to keep previewing drafts, or leave preview mode to see what visitors see.
      </p>
      <div className="mt-8 flex justify-center">
        <ExitPreviewForm path={path} className={buttonClass("primary")}>
          Exit preview
        </ExitPreviewForm>
      </div>
    </Container>
  );
}
