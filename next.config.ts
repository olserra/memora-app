import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    clientSegmentCache: true,
  },
};

export default nextConfig;
