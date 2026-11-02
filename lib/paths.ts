export { categoryPath, normalizePath, productPath, safeLocalPath } from "@spindlecommerce/storefront-client";

export const pathFromSegments = (segments: string[] | undefined) => `/${(segments ?? []).map((s) => decodeURIComponent(s)).join("/")}`;
