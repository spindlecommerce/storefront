import Image from "next/image";
import { cx } from "@/lib/cx";

/** From brand/ in the platform. The lettering is artwork, never set in a font. */
export function Logo({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  return (
    <Image
      src={tone === "dark" ? "/brand/spindle-dark-bg.svg" : "/brand/spindle-light-bg.svg"}
      alt="SpindleCommerce"
      width={524}
      height={144}
      unoptimized
      className={cx("h-8 w-auto", className)}
    />
  );
}
