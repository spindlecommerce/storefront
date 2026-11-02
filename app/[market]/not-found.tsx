import type { Metadata } from "next";
import Link from "@/components/ui/link";
import { buttonClass } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getT } from "@/lib/market";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).m.site.pageNotFound };
}

export default async function NotFound() {
  const { m } = await getT();
  return (
    <Container width="narrow" className="py-24 text-center sm:py-32">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">404</p>
      <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">{m.notFound.heading}</h1>
      <p className="mt-4 text-pretty text-lg text-stone-600">{m.notFound.text}</p>
      <div className="mt-10 flex justify-center">
        <Link href="/" className={buttonClass("primary", "light", "lg")}>
          {m.notFound.back}
        </Link>
      </div>
    </Container>
  );
}
