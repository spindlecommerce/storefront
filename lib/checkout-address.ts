import { format, type Messages } from "./i18n/translate";

/**
 * Address and email rules for the checkout forms and server actions. They match the API's
 * (src/lib/address.ts in the platform), with messages in the shopper's language.
 */

export const ADDRESS_FIELDS = ["firstName", "lastName", "company", "line1", "line2", "city", "region", "regionCode", "postalCode", "countryCode", "phone"] as const;

export type AddressField = (typeof ADDRESS_FIELDS)[number];
export type AddressFields = Record<AddressField, string>;

/** What the API's AddressInput takes. */
export type AddressInput = {
  firstName: string;
  lastName: string;
  company: string | null;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  regionCode: string | null;
  postalCode: string;
  countryCode: string;
  phone: string | null;
};

/** The API's AddressDraftInput: the country, and whatever else is filled in. */
export type AddressDraftInput = Partial<Omit<AddressInput, "countryCode">> & { countryCode: string };

export type Region = { code: string; name: string };

const regions = (list: string): Region[] =>
  list.split(";").map((entry) => {
    const [code, name] = entry.split("=");
    return { code: code!, name: name! };
  });

/** States, DC, territories and armed forces addresses (USPS codes). */
const US_STATES = regions(
  "AL=Alabama;AK=Alaska;AZ=Arizona;AR=Arkansas;CA=California;CO=Colorado;CT=Connecticut;DE=Delaware;DC=District of Columbia;FL=Florida;GA=Georgia;HI=Hawaii;ID=Idaho;IL=Illinois;IN=Indiana;IA=Iowa;KS=Kansas;KY=Kentucky;LA=Louisiana;ME=Maine;MD=Maryland;MA=Massachusetts;MI=Michigan;MN=Minnesota;MS=Mississippi;MO=Missouri;MT=Montana;NE=Nebraska;NV=Nevada;NH=New Hampshire;NJ=New Jersey;NM=New Mexico;NY=New York;NC=North Carolina;ND=North Dakota;OH=Ohio;OK=Oklahoma;OR=Oregon;PA=Pennsylvania;RI=Rhode Island;SC=South Carolina;SD=South Dakota;TN=Tennessee;TX=Texas;UT=Utah;VT=Vermont;VA=Virginia;WA=Washington;WV=West Virginia;WI=Wisconsin;WY=Wyoming;AS=American Samoa;GU=Guam;MP=Northern Mariana Islands;PR=Puerto Rico;VI=U.S. Virgin Islands;AA=Armed Forces Americas;AE=Armed Forces Europe;AP=Armed Forces Pacific",
);

const CA_PROVINCES = regions(
  "AB=Alberta;BC=British Columbia;MB=Manitoba;NB=New Brunswick;NL=Newfoundland and Labrador;NS=Nova Scotia;NT=Northwest Territories;NU=Nunavut;ON=Ontario;PE=Prince Edward Island;QC=Quebec;SK=Saskatchewan;YT=Yukon",
);

/** Countries whose addresses need a state or province from a list (sales tax depends on it). */
export const REGIONS: Record<string, Region[]> = { US: US_STATES, CA: CA_PROVINCES };

/** What a country's list of states or provinces is called, and the message when none is chosen. */
export const regionTexts = (m: Messages, country: string) => (m.address.regions as Record<string, { label: string; choose: string } | undefined>)[country] ?? null;

/** A country's own wording, or the default: forCountry(m.address.postal.label, "US") is "ZIP code". */
export const forCountry = (texts: { default: string }, country: string) => (texts as Record<string, string | undefined>)[country] ?? texts.default;

const POSTAL: Record<string, { pattern: RegExp; example: string; normalize?: (value: string) => string }> = {
  US: { pattern: /^\d{5}(-\d{4})?$/, example: "94105" },
  CA: { pattern: /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/i, example: "K1A 0B1", normalize: (v) => v.toUpperCase().replace(/^(\w{3})\s*(\w{3})$/, "$1 $2") },
};

export const postalLabel = (countryCode: string, m: Messages) => forCountry(m.address.postal.label, countryCode);

/** Every ISO 3166-1 country, for billing addresses, which may be anywhere. */
export const ISO_COUNTRY_CODES = (
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ " +
  "DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT " +
  "JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG " +
  "NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH " +
  "TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW"
).split(" ");

// ---------------------------------------------------------------- validation

/** The API's EmailAddress scalar accepts exactly these. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The address as the API takes it, or null. */
export const emailOf = (raw: string) => {
  const email = raw.trim().toLowerCase();
  return email.length <= 254 && EMAIL.test(email) ? email : null;
};

export const validateEmail = (raw: string, m: Messages): { email: string } | { error: string } => {
  const email = emailOf(raw);
  if (email) return { email };
  return { error: raw.trim() ? m.validation.emailInvalid : m.validation.emailRequired };
};

export const readAddressFields = (form: FormData, prefix = ""): AddressFields =>
  Object.fromEntries(ADDRESS_FIELDS.map((field) => [field, String(form.get(`${prefix}${field}`) ?? "").trim()])) as AddressFields;

/** Country first, since the other fields depend on it. */
const FORM_ORDER: AddressField[] = ["countryCode", "firstName", "lastName", "company", "line1", "line2", "city", "region", "regionCode", "postalCode", "phone"];

const LIMITS: Partial<Record<AddressField, number>> = { firstName: 100, lastName: 100, company: 200, line1: 200, line2: 200, city: 100, region: 100, postalCode: 20, phone: 40 };

/** `countries`: where the address may be (for shipping, the channel's countries). */
export const validateAddress = (
  fields: AddressFields,
  countries: { code: string; name: string }[],
  purpose: "shipping" | "billing",
  m: Messages,
): { address: AddressInput } | { errors: Partial<Record<AddressField, string>> } => {
  const errors: Partial<Record<AddressField, string>> = {};
  const country = fields.countryCode.toUpperCase();
  const { validation } = m;
  const required: [AddressField, string][] = [
    ["firstName", validation.firstName],
    ["lastName", validation.lastName],
    ["line1", validation.line1],
    ["city", validation.city],
  ];
  for (const [field, message] of required) if (!fields[field]) errors[field] = message;
  for (const [field, limit] of Object.entries(LIMITS) as [AddressField, number][]) {
    if (!errors[field] && fields[field].length > limit) errors[field] = format(validation.tooLong, { limit });
  }

  if (!country) errors.countryCode = validation.chooseCountry;
  else if (!countries.some((c) => c.code === country)) errors.countryCode = purpose === "shipping" ? validation.noShipping : validation.countryFromList;

  const choices = REGIONS[country];
  let regionCode: string | null = null;
  let region: string | null = fields.region || null;
  if (choices) {
    const choice = choices.find((r) => r.code === fields.regionCode.toUpperCase());
    if (!choice) errors.regionCode = regionTexts(m, country)?.choose ?? validation.chooseCountry;
    regionCode = choice?.code ?? null;
    region = choice?.name ?? null;
  }

  let postalCode = fields.postalCode;
  const postal = POSTAL[country];
  if (!postalCode) errors.postalCode = forCountry(m.address.postal.required, country);
  else if (postal && !postal.pattern.test(postalCode)) errors.postalCode = format(forCountry(m.address.postal.invalid, country), { example: postal.example });
  else if (postal?.normalize) postalCode = postal.normalize(postalCode);

  // In the order the form shows the fields, for the error summary.
  if (Object.keys(errors).length) return { errors: Object.fromEntries(FORM_ORDER.flatMap((field) => (errors[field] ? [[field, errors[field]]] : []))) };
  return {
    address: {
      firstName: fields.firstName,
      lastName: fields.lastName,
      company: fields.company || null,
      line1: fields.line1,
      line2: fields.line2 || null,
      city: fields.city,
      region,
      regionCode,
      postalCode,
      countryCode: country,
      phone: fields.phone || null,
    },
  };
};

/**
 * The fields typed so far that are already valid, so saving never fails. Null until the country is
 * one of `countries`.
 */
export const draftAddress = (fields: AddressFields, countries: { code: string }[]): AddressDraftInput | null => {
  const country = fields.countryCode.toUpperCase();
  if (!countries.some((c) => c.code === country)) return null;
  const draft: AddressDraftInput = { countryCode: country };
  for (const field of ["firstName", "lastName", "company", "line1", "line2", "city", "phone"] as const) {
    if (fields[field] && fields[field].length <= (LIMITS[field] ?? Infinity)) draft[field] = fields[field];
  }
  const choices = REGIONS[country];
  if (choices) {
    const choice = choices.find((r) => r.code === fields.regionCode.toUpperCase());
    if (choice) Object.assign(draft, { regionCode: choice.code, region: choice.name });
  } else if (fields.region && fields.region.length <= LIMITS.region!) {
    draft.region = fields.region;
  }
  const postal = POSTAL[country];
  if (fields.postalCode && fields.postalCode.length <= LIMITS.postalCode! && (!postal || postal.pattern.test(fields.postalCode))) {
    draft.postalCode = postal?.normalize?.(fields.postalCode) ?? fields.postalCode;
  }
  return draft;
};
