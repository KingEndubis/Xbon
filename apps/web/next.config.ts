import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: '/Xbon',
  assetPrefix: '/Xbon/',
  outputFileTracingRoot: process.cwd(),
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  distDir: 'out',
};

export default nextConfig;
