import { addressLines, type Address, type Country } from "@/lib/checkout-types";
import { cx } from "@/lib/cx";

export function AddressView({ address, countries, inline, className }: { address: Address; countries?: Country[]; inline?: boolean; className?: string }) {
  const lines = addressLines(address, (code) => countries?.find((c) => c.code === code)?.name);
  if (inline) return <span className={className}>{lines.join(", ")}</span>;
  return (
    <address className={cx("not-italic", className)}>
      {lines.map((line, i) => (
        <span key={i} className="block">
          {line}
        </span>
      ))}
    </address>
  );
}
