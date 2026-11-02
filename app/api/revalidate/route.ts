import { createRevalidateRoute } from "@spindlecommerce/storefront-next";
import { config } from "@/lib/config";

/** The storefront's revalidate path: platform webhooks expire the cached responses they affect. */
export const POST = createRevalidateRoute({ secret: config.revalidateSecret });
