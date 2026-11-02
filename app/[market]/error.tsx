"use client";

import { useEffect } from "react";
import { useT } from "@/components/market-provider";
import { buttonClass } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const t = useT();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <Container width="narrow" className="py-24 text-center sm:py-32">
      <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{t.m.error.heading}</h1>
      <p className="mt-4 text-pretty text-stone-600">{t.m.error.text}</p>
      {error.digest && <p className="mt-2 font-mono text-xs text-stone-400">{t.f(t.m.error.reference, { digest: error.digest })}</p>}
      <div className="mt-8 flex justify-center">
        <button type="button" onClick={() => retry()} className={buttonClass("primary")}>
          {t.m.error.retry}
        </button>
      </div>
    </Container>
  );
}
