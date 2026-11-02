"use client";

import { useState } from "react";
import { useT } from "@/components/market-provider";
import { postalLabel, REGIONS, regionTexts, type AddressField } from "@/lib/checkout-address";
import type { Address, Country } from "@/lib/checkout-types";
import { SelectField, TextField } from "./fields";

type Props = {
  /** Fields are submitted as `<section>.<field>` ("shipping.city"), with ids `<section>-<field>`. */
  section: "shipping" | "billing";
  countries: Country[];
  /** The cart's, as far as it is filled in. */
  initial: Partial<Address> | null;
  /** By field name ("city"). */
  errors: Record<string, string>;
};

/** Uncontrolled, so what the shopper types stays put while the page refreshes around it. */
export function AddressFields({ section, countries, initial, errors }: Props) {
  const { m } = useT();
  const start = (field: AddressField) => initial?.[field] ?? "";
  const [country, setCountry] = useState(() => {
    const wanted = start("countryCode");
    return countries.some((c) => c.code === wanted) ? wanted : (countries[0]?.code ?? "");
  });
  const regions = REGIONS[country];
  const regionLabel = regionTexts(m, country)?.label ?? m.address.region;
  const field = (name: AddressField) => ({ form: section, name, inputName: `${section}.${name}`, error: errors[name] });
  const ac = (token: string) => `${section} ${token}`;

  return (
    <div className="grid gap-4 sm:grid-cols-6">
      <SelectField {...field("countryCode")} label={m.address.country} value={country} onChange={(e) => setCountry(e.target.value)} autoComplete={ac("country")} className="sm:col-span-6">
        {countries.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </SelectField>
      <TextField {...field("firstName")} label={m.address.firstName} defaultValue={start("firstName")} autoComplete={ac("given-name")} maxLength={100} className="sm:col-span-3" />
      <TextField {...field("lastName")} label={m.address.lastName} defaultValue={start("lastName")} autoComplete={ac("family-name")} maxLength={100} className="sm:col-span-3" />
      <TextField {...field("company")} label={m.address.company} optional defaultValue={start("company")} autoComplete={ac("organization")} maxLength={200} className="sm:col-span-6" />
      <TextField {...field("line1")} label={m.address.line1} defaultValue={start("line1")} autoComplete={ac("address-line1")} maxLength={200} className="sm:col-span-6" />
      <TextField {...field("line2")} label={m.address.line2} optional defaultValue={start("line2")} autoComplete={ac("address-line2")} maxLength={200} className="sm:col-span-6" />
      <TextField {...field("city")} label={m.address.city} defaultValue={start("city")} autoComplete={ac("address-level2")} maxLength={100} className="sm:col-span-2" />
      {regions ? (
        <SelectField key={country} {...field("regionCode")} label={regionLabel} defaultValue={start("regionCode")} autoComplete={ac("address-level1")} className="sm:col-span-2">
          <option value="">{m.address.choose}</option>
          {regions.map((r) => (
            <option key={r.code} value={r.code}>
              {r.name}
            </option>
          ))}
        </SelectField>
      ) : (
        <TextField key={country} {...field("region")} label={regionLabel} optional defaultValue={start("region")} autoComplete={ac("address-level1")} maxLength={100} className="sm:col-span-2" />
      )}
      <TextField
        {...field("postalCode")}
        label={postalLabel(country, m)}
        defaultValue={start("postalCode")}
        autoComplete={ac("postal-code")}
        inputMode={country === "US" ? "numeric" : undefined}
        autoCapitalize="characters"
        maxLength={20}
        className="sm:col-span-2"
      />
      <TextField {...field("phone")} type="tel" label={m.address.phone} optional hint={m.address.phoneHint} defaultValue={start("phone")} autoComplete={ac("tel")} maxLength={40} className="sm:col-span-6" />
    </div>
  );
}
