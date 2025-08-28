import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbopack: {
      root: __dirname, // point turbopack root to this app to avoid multi-lockfile confusion
    },
  },
};

export default nextConfig;
