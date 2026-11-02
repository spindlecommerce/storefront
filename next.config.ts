import type { NextConfig } from "next";
import { IMAGE_PATTERNS } from "./lib/images";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: IMAGE_PATTERNS,
  },
};

export default nextConfig;
