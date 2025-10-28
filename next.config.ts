import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    clientSegmentCache: true,
  },
};

export default nextConfig;
