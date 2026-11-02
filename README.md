# SpindleCommerce sample storefront

A Next.js storefront for SpindleCommerce: pages from the admin's page builder, visual editing in the
admin's page editor, revalidation on publish webhooks, product and category pages, a cart and a
one-page checkout. It uses Next.js 16 (App Router, Turbopack), React 19, strict TypeScript and
Tailwind CSS 4.

## Setup

You need Node.js 20.9+, pnpm, and the [SpindleCommerce platform](https://github.com/spindlecommerce/spindlecommerce)
running. `pnpm dev` in its checkout serves the API and admin on http://localhost:4000, with the demo
pages after `pnpm db:seed`.

Clone this repository into the platform checkout as `storefront/`, which the platform ignores:

```bash
git clone https://github.com/spindlecommerce/storefront.git storefront   # inside the platform checkout
cd storefront
cp .env.example .env.local   # SPINDLE_API_URL, SPINDLE_CHANNEL, SPINDLE_REVALIDATE_SECRET
pnpm install
pnpm dev                     # http://localhost:3000
```

The storefront is its own pnpm project. Its `pnpm-workspace.yaml` keeps it out of the platform's
workspace and sets `minimumReleaseAge`, so only packages published at least two weeks ago are
installed, other than SpindleCommerce's own.

It is built on the storefront packages, `@spindlecommerce/storefront-client`, `-react`, `-next` and
`-cli` ([storefront-sdk](https://github.com/spindlecommerce/storefront-sdk)).

| Script | |
| --- | --- |
| `pnpm dev` | Development server on port 3000 |
| `pnpm build`, `pnpm start` | Production build and server (port 3000) |
| `pnpm lint`, `pnpm typecheck` | ESLint, and `next typegen` + `tsc` |
| `pnpm components:types` | Regenerate `lib/builder-components.ts` from `components.json` |
| `pnpm components:push` | Deploy `components.json` to the API (needs `SPINDLE_API_KEY`, also read from `.env.local`) |

The `components:` scripts run `spindle-storefront`, from `@spindlecommerce/storefront-cli`.

Settings (`.env.local`, see `.env.example`):

| Variable | |
| --- | --- |
| `SPINDLE_API_URL` | The API, default `http://localhost:4000` |
| `SPINDLE_CHANNEL` | Channel code sent as `x-channel`; default `eu` (the demo data has `eu` and `us`) |
| `SPINDLE_LOCALES` | The channel's languages to offer, comma separated, default first; default `en-GB,de-DE,fr-FR` |
| `SPINDLE_CURRENCIES` | The channel's currencies to offer, default first; default `GBP,EUR` |
| `SPINDLE_REVALIDATE_SECRET` | Verifies webhook signatures on `/api/revalidate`; empty turns it off |
| `SPINDLE_ADMIN_ORIGIN` | Origins allowed to frame the storefront; default: the origin of `SPINDLE_API_URL`, which serves the admin |
| `SPINDLE_SITE_URL` | Public URL, for canonical links and the sitemap; on Vercel, the production domain by default |
| `SPINDLE_MEDIA_HOSTS` | Media hosts besides Vercel Blob and the API (S3, R2, Supabase Storage or a CDN), so their images go through `next/image` |

## Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fspindlecommerce%2Fstorefront&project-name=spindlecommerce-storefront&repository-name=spindlecommerce-storefront&env=SPINDLE_API_URL%2CSPINDLE_CHANNEL%2CENABLE_EXPERIMENTAL_COREPACK&envDefaults=%7B%22SPINDLE_CHANNEL%22%3A%22eu%22%2C%22ENABLE_EXPERIMENTAL_COREPACK%22%3A%221%22%7D&envDescription=SPINDLE_API_URL%20is%20your%20SpindleCommerce%20deployment%27s%20URL%2C%20such%20as%20https%3A%2F%2Fspindlecommerce.vercel.app.%20SPINDLE_CHANNEL%20is%20the%20channel%20to%20sell%20in%20%28the%20demo%20data%20has%20eu%20and%20us%29.&envLink=https%3A%2F%2Fgithub.com%2Fspindlecommerce%2Fstorefront%23deploy-on-vercel)

Vercel builds the storefront with no configuration. Deploy the platform (API and admin, its own
Vercel project) first, since the storefront needs its URL. Its README has a Deploy button too, and
[docs/deploy-vercel.md](https://github.com/spindlecommerce/spindlecommerce/blob/main/docs/deploy-vercel.md)
has the details.

The button copies this repository to your Git account, creates the project, asks for
`SPINDLE_API_URL` (the platform's URL), and sets `SPINDLE_CHANNEL=eu` and
`ENABLE_EXPERIMENTAL_COREPACK=1`. That covers steps 1 and 2.

1. Import this repository as a new Vercel project with `ENABLE_EXPERIMENTAL_COREPACK=1`, so Vercel
   installs with the pnpm version in `package.json` (`packageManager`), which reads the two-week
   `minimumReleaseAge` from `pnpm-workspace.yaml`.
2. Set the environment variables:
   - `SPINDLE_API_URL`: the platform's URL, e.g. `https://ecom-api.vercel.app`.
   - `SPINDLE_CHANNEL`: `eu` for the demo data's Europe store.
   - `SPINDLE_LOCALES` and `SPINDLE_CURRENCIES`, only for languages or currencies other than the demo's
     (English, German and French, in pounds and euros). For `us`, set `SPINDLE_LOCALES=en-US` and
     `SPINDLE_CURRENCIES=USD`.
   - `SPINDLE_ADMIN_ORIGIN`, only if staff open the admin somewhere other than the platform's URL,
     whose origin may frame the storefront by default.
   - `SPINDLE_MEDIA_HOSTS`, if media is stored somewhere other than Vercel Blob.
   - `SPINDLE_SITE_URL`, only if the production domain isn't the public one.
3. Deploy, then register the storefront in the admin under **Settings › Storefronts**: its
   production URL, the preview route `/api/draft` and the revalidate route `/api/revalidate`. With
   the demo data, edit the Sample storefront instead of adding one. Copy the signing secret the
   admin shows once into `SPINDLE_REVALIDATE_SECRET`, and redeploy.
4. Optionally, create a Deploy Hook (Vercel project settings › Git › Deploy Hooks) and paste its
   URL into the storefront's settings, so **Deploy** in the admin rebuilds the site.

## How it works

```
app/[market]/[[...path]]/page.tsx   every URL: route(path) → page, product, category, redirect, 404
app/[market]/layout.tsx    header and footer (singletonPage site_header / site_footer), <html lang>
app/[market]/cart/page.tsx the cart
app/[market]/checkout/…    checkout, Stripe's return page (complete/) and the confirmation page
app/api/draft/…            enter and leave draft mode
app/api/revalidate         webhook receiver
proxy.ts                   the market rewrite, and Content-Security-Policy: frame-ancestors
lib/markets.ts             the languages and currencies on offer, URL prefixes, market keys
lib/market.ts              the request's market (route segment, or inMarket in actions)
lib/i18n/                  the storefront's own text: en (the source), de, fr
lib/storefront.ts          the Storefront API in the request's market (@spindlecommerce/storefront-next)
lib/builder-components.ts  types for the component library, generated from components.json
lib/variants.ts            which options product cards offer, and adding to the cart from a form
lib/checkout*.ts           checkout in the shopper's language, server actions, address rules
components/ecom/           one component per page builder component, plus registry.tsx
components/product/        product page parts (overview, description and specs, JSON-LD, card grid)
components/category/       category page parts (heading, subcategory links, listing)
components/checkout/       the checkout form, order summary, payment forms
```

**Data layer** (`lib/storefront.ts`, server-only), on `@spindlecommerce/storefront-next`. Every request sends `x-channel`, and the page's
language and currency as `x-locale` and `x-currency`. Outside draft mode, responses are cached
with `next: { tags, revalidate: 300 }`. In draft mode they are fetched with `cache: "no-store"` and
the `x-preview-token` from an httpOnly cookie. GraphQL errors become a `StorefrontApiError`. A 401 in
draft mode, or a missing token cookie, becomes `PreviewExpiredError`, and the page shows a "Preview
expired" notice with an exit button. Only draft mode reads cookies, so published pages never depend
on them.

**Pages.** Every URL resolves through `route(path)` to a builder page, a product
(`/products/<slug>`), a category (`/categories/<slug path>`) or a redirect. `Page.content` is the
component tree in the request locale. `PageContent` (`components/ecom/registry.tsx`) renders the
`sections` of a landing page, product template or category template with the registered components,
one per page builder component, typed from the library in `lib/builder-components.ts`. Products and
categories referenced by global id come from `Page.references`. A product grid with a category or
"newest" source fetches its own products.

## Product and category templates

A content type with `templateFor: "product"` or `"category"` makes its pages templates, designed in
the page editor. They have no path: product (or category) pages render with them. The library has
`product_page` and `category_page`, whose `sections` take the components below and every general
section (hero, rich text, product grid, promo banner, feature list, FAQ, …).

**Which template.** The API returns it as `Product.template` / `Category.template`, most specific
first. For a product: the template assigned to it, then one assigned to its nearest category, then
the default. For a category: its own, then the default. Visitors get published templates only,
and with the preview token, drafts count too. With no template (`template` is null), the built-in
layout renders: `components/product/product-view.tsx` or `components/category/category-view.tsx`.

**Fetching.** For `/products/…` and `/categories/…` URLs, `getRoute` (`@spindlecommerce/storefront-next`) fetches the
template in a query of its own, alongside the route. One query would select more fields than the
API allows: a breadth of 250, counting the `__typename` and `id` fields its response cache adds.
The product's or category's own sections need a third query, for the same reason. URLs that name a
product or category by slug alone only redirect, so they fetch neither. If the template can't be
loaded, visitors get the built-in layout and the error is logged. If the sections can't, visitors
get the page without them. Draft mode shows the error.

**Rendering.** `PageContent` renders the template like a landing page, with `ctx.product` or
`ctx.category` (and for categories, `ctx.searchParams`) in the render context. The page's metadata
and the product's JSON-LD are the same whichever layout renders. The h1 is the product's or
category's name: `product_details` and `category_header` show it, otherwise it is visually hidden,
and heroes in templates use h2.

| Component | Shows |
| --- | --- |
| `product_details` | Breadcrumbs, gallery, name, price, options and add to cart, with an editable note under the button. Variations `gallery_left`, `gallery_right` |
| `product_description` | The description (sanitized HTML) under a title |
| `product_specs` | The attributes as a table under a title |
| `related_products` | Products from the product's deepest category (without the product itself), or the newest; 2 to 12 |
| `category_header` | Breadcrumbs, name and description. Variations `simple`, and `banner` over a full-width image |
| `subcategories` | Links to the category's children as `pills` or `cards`; nothing when it has none |
| `category_products` | The category's products with sorting and pages, as the built-in page lists them (`?sort`, `?after`, `?trail`), in the Featured order merchandised in the admin by default |
| `product_sections`, `category_sections` | The product's or category's own sections (below); nothing when it has none, a note in draft mode |

They are built from the built-in pages' parts (`components/product/*`, `components/category/*`).
Outside a template they have no product or category, and render nothing, or a note in draft mode.
In the editor, the titles, the purchase note and the banner image are editable. Catalog data
(names, prices, descriptions, attributes) is edited in the catalog, so it has no field markup.

**Preview.** A template's preview opens a product (or category) page with a token that renders
every product (or category) page with that template, so editors can browse other products in the
frame. The template is a document of its own (`data-ecom-document` with its id), so its components
are selected and edited in place like a page's.

**Revalidation.** Template responses are tagged `spindle:templates:product` or
`spindle:templates:category`, plus `spindle:pages` and `spindle:catalog` (see [Revalidation](#revalidation)).

### A product's or category's own sections

Sections give one product or category components of its own inside its template's layout. They are
a page of `product_sections_page` or `category_sections_page`, belonging to that product or
category and edited from its admin screen. The API returns them as `Product.sections` /
`Category.sections`, or null.

The template places them with `product_sections` or `category_sections`. That component renders
them as a document of their own (their id in `data-ecom-document`, their own references), with the
same product or category in the context, so the editor edits them in place. They take the general
sections and the product's (or category's) data components. `ctx.sections` is never set inside
them, so they can't nest. In draft mode, sections the template doesn't place show after it, under a
note, so editors can still edit them. Visitors don't see them.

Their responses are tagged `spindle:sections:product` or `spindle:sections:category`, plus
`spindle:pages` and `spindle:catalog`.

## Languages and currencies

The storefront sells in one channel (`SPINDLE_CHANNEL`), in the channel languages and currencies
listed in `SPINDLE_LOCALES` and `SPINDLE_CURRENCIES`, the first being the default. With the demo's Europe
channel that is English, German and French, in pounds or euros. The header's picker switches either.

- **The language is in the URL.** `/products/oxford-shirt` is English, `/de/products/oxford-hemd`
  German, `/fr/products/chemise-oxford` French. A slug from another language redirects
  (`/fr/categories/men` → `/fr/categories/homme`), and `/en/…` redirects to the plain URL. Pages
  list their other languages as `hreflang` alternates, and the sitemap has every page in every
  language.
- **The currency is a cookie** (`ecom_currency`), set by the picker, so URLs, links and search
  results don't split by currency.
- **How pages stay cached.** `proxy.ts` rewrites every page request to an internal root segment,
  `app/[market]/…`, with the language from the path and the currency from the cookie:
  `/de/products/x` in euros renders `/de-DE~EUR/products/x`. Pages and the data layer read the
  market from that segment (`next/root-params`, `lib/market.ts`), never from a cookie. `x-locale`
  and `x-currency` are part of the key in Next's data cache and the API's response cache, so each
  market is cached on its own. Webhook tags carry no market, so a publish expires every market at
  once. Carts and checkout are per shopper and not cached.
- **Server Actions** can't read the route's market, so the page binds it as the first argument
  (`addToCartAction.bind(null, market)`) and the action runs in it (`inMarket`). Stripe's return
  route has the market in its path.
- **Carts move with the shopper.** A cart has one currency and language. Switching either moves an
  open cart (`cartUpdate` with `currencyCode` and `locale`), keeping its items, discount codes and
  checkout details, re-priced and with line names in the new language. A shipping or payment method
  the new currency lacks goes back to the cheapest. A cart in a currency this storefront doesn't
  offer (after changing `SPINDLE_CHANNEL`, say) is left alone, and the next add to cart starts a new
  one.
- **The storefront's own text** (buttons, labels, messages) is in `lib/i18n/`: `en.ts` is the
  source, and TypeScript checks that `de.ts` and `fr.ts` have the same keys. Server components read
  it with `getT()`, client components with `useT()`. Stock problems, cart line issues and discount
  code refusals are translated from the API's codes. Other API messages, such as a plugin's checkout
  rule, show as sent. Content (products, pages, header and footer, shipping and payment method
  names) comes translated from the API.
- **Adding a language.** Add it to the channel in the admin and translate the content. Add
  `lib/i18n/<language>.ts` (a copy of `en.ts`, typed `Messages`) to `MESSAGES` in
  `lib/i18n/index.ts`, and list the locale in `SPINDLE_LOCALES`. Without a dictionary, a language gets
  the storefront's text in English.

## Checkout

`/checkout` is one page: contact (email), delivery address, shipping method, payment with the
billing address ("use the shipping address" by default), and one **Pay now** button. Carts with
nothing to ship (`Cart.requiresShipping` false, e.g. a digital gift card) skip delivery and
shipping, and ask for the billing address.

Nothing is saved step by step. What the shopper types is saved as they go (`cartUpdate`, a moment
after they stop typing or when they leave a field), so a reload keeps everything. This needs a
platform with `cartUpdate`, so deploy the platform first.

- **Shipping options** appear once the address has a postal code, with the cheapest selected.
  Picking another saves it at once. The order summary (lines, discount code, discounts, shipping,
  estimated tax, total) refreshes with each save, and fades while it updates.
- **Paying checks everything at once.** Each problem shows at its field and in a list above the
  button, and focus moves to the first. Fields are also checked when the shopper leaves them, but
  only for what they typed: nothing is flagged as missing before they try to pay.
- **One call places the order.** `checkoutPlaceOrder` gets every detail in its `input` with the
  payment, so the order has exactly what the form shows.
- **Server actions** (`lib/checkout-actions.ts`) call `cartUpdate`, `cartCouponApply` /
  `cartCouponRemove`, `cartPaymentSessionCreate` and `checkoutPlaceOrder` on the cart in the
  httpOnly cookie, so the cart id never reaches the browser. They first check their input against
  the API's rules (`lib/checkout-details.ts`, `lib/checkout-address.ts`). Saving sends only what is
  filled in and valid, and paying needs everything. Errors come back by field, from those checks or
  the API's `fieldErrors`.
- **Countries.** Shipping addresses take the channel's countries
  (`localization.channel.countries`), and the API refuses others. Billing addresses take any
  country, named in the request locale. US and Canadian addresses pick a state or province
  (`regionCode`), which US sales tax depends on.
- **One idempotency key per checkout attempt.** The browser makes a key when the shopper places the
  order and resends it on a retry (a double click, a lost response), so the API returns the same
  order instead of placing a second. A definitive failure (declined, cart changed) ends the attempt,
  and the next gets a new key.

**Payments.** `PaymentMethodOption.provider` says how a method is paid:

| Provider | At checkout |
| --- | --- |
| `test_gateway` | Labelled "Test mode": the shopper picks a test token, sent as `payment.token`. `tok_visa` succeeds, `tok_declined` and `tok_insufficient_funds` are declined |
| `offline` | Nothing to enter. The method's instructions (check, bank transfer, …) show before placing the order and on the confirmation page. The order awaits payment |
| `stripe` | Stripe's Payment Element (`@stripe/stripe-js`, `@stripe/react-stripe-js`), below |
| anything else | Works if it needs no payment session (`sessionRequired` false). Methods that need one have no payment form here, so they are listed as not available, and checkout asks for another method |

A declined payment (`PaymentDeclinedError`) shows the reason. The API has released the stock and
reopened the cart, so the shopper can try another card or method.

**Stripe.** Nothing to set up in the storefront. In the platform's admin, enable and configure the
Stripe plugin (Settings › Plugins) and add a payment method with the `stripe` provider (Settings ›
Payments), as in the platform's
[docs/payments.md](https://github.com/spindlecommerce/spindlecommerce/blob/main/docs/payments.md). The
publishable key comes with the payment session, so no Stripe key or environment variable lives
here.

1. When a Stripe method is chosen, the payment section loads the Stripe code (a separate chunk) and
   calls `cartPaymentSessionCreate`, whose `clientData` holds `clientSecret` and `publishableKey`.
   Stripe.js loads from `js.stripe.com`, as PCI rules require, and the Payment Element mounts. When
   the total changes (the address, a discount code), the session is updated, keeping the same
   PaymentIntent, and the element fetches the new amount. A total of zero has no PaymentIntent.
2. **Pay now** checks the Payment Element (`elements.submit()`, while the click still counts as the
   shopper's, so wallets can open their sheet), saves every detail, brings the session up to the
   final total, confirms the payment in the browser
   (`stripe.confirmPayment({ redirect: "if_required" })`), then places the order with an empty
   `payment`. The platform checks the PaymentIntent with Stripe.
3. Payment methods that leave the site (3-D Secure pages, bank redirects) return to
   **`<storefront origin>/checkout/complete`** under the page's language prefix
   (`/de/checkout/complete`). The origin comes from the browser, so preview deployments work too.
   That route reads the cart from the cookie and places the order with an idempotency key derived
   from the `payment_intent` parameter, so a reload can't place a second order. If Stripe's webhook
   placed the order first, the API returns it. The route then goes to the confirmation page, or
   back to checkout with the reason. It only places orders for carts paid through a payment session,
   which the platform checks with Stripe, so a link to it can't place an order the shopper didn't
   submit and pay for.
4. If the session or Stripe.js can't load (plugin not configured, content blocker, network), the
   payment section says so, offers to try again and keeps **Pay now** disabled.

A Content-Security-Policy beyond `frame-ancestors` (`proxy.ts`) must allow what Stripe's CSP guide
lists for Stripe.js: scripts and frames from `js.stripe.com`, requests to `api.stripe.com`, and so
on.

**Confirmation.** After the order is placed, the cart cookie is cleared and the shopper lands on
`/checkout/confirmation/<number>`: lines and totals, addresses, shipping method, payment method and
status, and offline methods' payment instructions. Guests read their order with
`guestOrder(email, number, postalCode)`, from a short-lived httpOnly cookie set at placement (an
hour, path `/checkout/confirmation` in the order's language, this browser only), which also keeps
the cart id for the payment method's name and instructions. The storefront has no customer sign-in,
so it doesn't use `order(number)`, which needs one.

**Testing with the test gateway.** The demo data (`pnpm db:seed` in the platform) has "Card" and
"Card (instant capture)" (test gateway) and "Bank transfer" (offline) in the `eu` channel, "Check /
money order" and "Cash on delivery" (offline, US addresses) in the `us` channel, and the codes
`FREESHIP` and `SUMMER20` (shirts).

1. Add something to the cart, then **Checkout**.
2. Fill in your details. Shipping options and totals follow the address as you type, and **Card**
   is chosen.
3. Under **Test card**, pick **Visa ending 4242** and **Pay now**: the confirmation page shows it
   authorized. **Declined card** shows the decline message instead, the cart stays open, and
   another try goes through.
4. Choose **Bank transfer** to see an order awaiting payment, with its instructions.

These are real orders in the platform's database (admin › Orders).

## Preview and visual editing

The admin opens the storefront's preview route, and frames it in its page editor:

```
GET /api/draft?token=<preview token>&path=/summer-sale[&locale=de-DE][&channel=eu]
```

The route checks the token with `previewSession` (401 when the API rejects it), turns on draft
mode, and stores the token, locale, channel and the session's `adminOrigin` in httpOnly cookies
that expire with the token. It then redirects to `path`, which must be on this site, in the
preview's language (`/de/summer-sale` for `locale=de-DE`). `POST /api/draft/disable` (or
`GET …?path=`) leaves draft mode. Outside the editor, a "Preview mode · Exit" badge shows.

In draft mode, each document on the page (the page or a product's or category's template, the
header, the footer) is wrapped in `data-ecom-document`. Components carry `data-ecom-node` and
`data-ecom-component`, and fields carry `data-ecom-field` (`<nodeId>.<field>`,
`<nodeId>.<list>.<itemId>`, `<nodeId>.<list>.<itemId>.<field>`). `data-ecom-patch="text"` marks
elements whose text is exactly the field value: the bridge patches those as the editor types, and
editors can double-click them to edit in place. Outside draft mode, the helpers from
`editable()` (`@spindlecommerce/storefront-client`) return nothing, so published HTML has none of this. `<VisualEditing>` (`@spindlecommerce/storefront-next`) loads
`${SPINDLE_API_URL}/visual-editing/bridge.js` and connects it to the admin. When the editor saves, it
re-renders with `router.refresh()` in a transition, and tells the bridge once
the new content has committed. The editor navigates with `router.push`.

**Framing.** `proxy.ts` sends `Content-Security-Policy: frame-ancestors 'self' <SPINDLE_ADMIN_ORIGIN>`
(by default the origin of `SPINDLE_API_URL`) on every page, at runtime, so a deployment needs only the
variable, not a rebuild. Next.js sends no `X-Frame-Options`.

**Cookies across sites.** In development, the admin (`localhost:4000`) and storefront
(`localhost:3000`) are the same site, so `SameSite=Lax` cookies work in the frame. With the admin
on another site (say `admin.example-platform.com` framing `shop.example.com`), the storefront is a
third party in the frame. Its cookies then need `SameSite=None; Secure`, and browsers that block
third-party cookies keep them only with `Partitioned` (CHIPS). So over HTTPS, the draft route sets
all its cookies `SameSite=None; Secure; Partitioned`, and re-sets Next.js's `__prerender_bypass`
cookie partitioned too. A partitioned cookie set in the editor belongs to that embedding only, so
opening the preview in its own tab starts a separate preview session. Safari blocks third-party
cookies in frames regardless: for Safari, serve the admin and storefront from the same site, such
as `admin.shop.com` and `shop.com`.

## Revalidation

Turn it on in the admin under **Settings › Storefronts**, or with the admin mutation
`frontendUpdate(id, input: { revalidatePath: "/api/revalidate" })`. The platform then subscribes the
storefront to `page.*`, `release.published`, `product.*`, `category.*` and `component.updated`.
Copy the signing secret it shows once into `SPINDLE_REVALIDATE_SECRET`. For a storefront on
`localhost`, the platform needs `ALLOW_PRIVATE_WEBHOOK_URLS=true` in its `.env`, or it refuses
webhooks to private addresses.

`POST /api/revalidate` checks `x-spindle-signature: t=<unix>,v1=<hex HMAC-SHA256 of "t.body">` with a
5-minute tolerance and a constant-time comparison, reads the event type from the signed body, and
expires these tags:

| Event | Tags |
| --- | --- |
| `page.published`, `page.unpublished` | `spindle:path:<path>` and `<previousPath>`. For the header or footer: `spindle:singleton:<type>`. For a product or category template (the payload has `templateFor`): `spindle:templates:<templateFor>`, every product (or category) page. For a product's or category's own sections (`sectionsFor`): `spindle:sections:<sectionsFor>`. If the page appeared, moved or went away: `spindle:pages` (links on other pages) |
| `page.targets_updated` | `spindle:templates:<templateFor>`: a template's products, categories or default changed |
| `release.published` | `spindle:pages` |
| `product.*`, `category.*`, `price.*`, `inventory.*` | `spindle:catalog` (stale-while-revalidate) |
| `component.updated` | `spindle` (everything) |

Content events expire at once (`revalidateTag(tag, { expire: 0 })`), so the next visit sees the
publish. Catalog events use the `"max"` profile, serving stale content while revalidating. To try it
by hand:

```bash
body='{"id":"evt_1","type":"page.published","occurredAt":"2026-01-01T00:00:00Z","data":{"aggregateType":"Page","aggregateId":"…","type":"landing_page","path":"/summer-sale","previousPath":"/summer-sale"}}'
t=$(date +%s)
sig=$(printf '%s' "$t.$body" | openssl dgst -sha256 -hmac "$SPINDLE_REVALIDATE_SECRET" -hex | sed 's/^.* //')
curl -X POST localhost:3000/api/revalidate -H 'content-type: application/json' -H "x-spindle-signature: t=$t,v1=$sig" -d "$body"
```

## Adding a component

Component definitions live with the code that renders them, in `components.json`, in the
format `componentsSync` takes. The demo library came from the platform's `src/db/seed-builder.ts`.

1. **Define it.** Add an entry to `components.json` with its `code`, `kind: "component"`,
   `fields` and `variations`, and allow it where it may appear: for a page section, in
   `landing_page`'s `sections.allowedComponents`.
2. **Type it.** Run `pnpm components:types`.
3. **Render it.** Write `components/ecom/<name>.tsx`, taking `{ node, ctx }: NodeProps<YourNode>`.
   Annotate it with `ctx.edit.node(node)`, `ctx.edit.field(node.id, "field")` and
   `ctx.edit.text(node.id, "field")`, and render child blocks with `ctx.renderBlocks(…)`. A
   component with `templateFor` (it shows a product's or category's data) reads `ctx.product` or
   `ctx.category`, and returns `<NoTemplateData>` when there is none. Register it in
   `components/ecom/registry.tsx`, which is typed by the generated codes, so a missing entry is a
   type error. A new content type also needs an entry in `LAYOUTS` there.
4. **Deploy the definition** with `SPINDLE_API_KEY=ek_… pnpm components:push`, using an API key with
   `content:write`, or put `SPINDLE_API_KEY` in `.env.local`. Editors can then add the component.

Until a component is registered, pages that use it render nothing in its place for visitors, and
a dashed "Unknown component" box in draft mode.

## Notes

- **Cart.** "Add to cart" uses `cartCreate` and `cartLinesAdd`. The cart id is kept in an httpOnly
  cookie, and a readable item count feeds the header badge without making pages dynamic. `/cart`
  changes quantities and removes lines with server actions, and links to [checkout](#checkout).
- **Product cards.** Hovering a card shows its second photo and its sizes, and tabbing into it shows
  the sizes; picking one adds that variant to the cart. On touch screens the bag button opens them.
  Colours are the option with swatches: each shows the photos linked to its variants, then those
  linked to none. Sizes are the `size` attribute. Products with no options, or colours only, add
  with one button; products with any other option link to their page.
- **Images.** Images from picsum.photos, the API host, Vercel Blob and `SPINDLE_MEDIA_HOSTS` go through
  `next/image` (Vercel's image optimization). Others are shown as is (`lib/images.ts`). The demo
  catalog's photos come from picsum.photos, and databases seeded before it had photos show
  placeholders for products.
- `next dev` writes an `AGENTS.md` that points coding agents at the Next.js docs in
  `node_modules/next/dist/docs`. It is regenerated on every run, so it is not committed. Set
  `agentRules: false` in `next.config.ts` to stop it.
