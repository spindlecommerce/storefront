import { createDraftDisableRoute } from "@spindlecommerce/storefront-next";

const route = createDraftDisableRoute();

/** GET /api/draft/disable?path=/summer-sale */
export const GET = route.GET;

/** The preview badge's form. */
export const POST = route.POST;
