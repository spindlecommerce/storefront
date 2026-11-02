import { mediaUrl } from "@spindlecommerce/storefront-client";
import { imagePatterns, isOptimizable as optimizable, type ImagePattern } from "@spindlecommerce/storefront-next/images";

/**
 * Image hosts, for next.config.ts and <EcomImage>. Images on them go through the optimizer; others,
 * and any on a local address, are shown as is.
 */

const apiUrl = process.env.SPINDLE_API_URL || "http://localhost:4000";

export const IMAGE_PATTERNS: ImagePattern[] = [
  // The demo content's photos; picsum.photos redirects to fastly.picsum.photos.
  { protocol: "https", hostname: "picsum.photos" },
  { protocol: "https", hostname: "fastly.picsum.photos" },
  // The API's own uploads, a Vercel Blob store, and SPINDLE_MEDIA_HOSTS.
  ...imagePatterns({ apiUrl, mediaHosts: process.env.SPINDLE_MEDIA_HOSTS }),
];

/** Content may hold paths on the API host, e.g. /media/…. */
export const imageUrl = (src: string) => mediaUrl(apiUrl, src);

export const isOptimizable = (src: string) => optimizable(imageUrl(src), IMAGE_PATTERNS);
