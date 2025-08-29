import type { NextConfig } from 'next'

// Detect when building for GitHub Pages (GH Actions / Pages)
const isGithubPages = process.env.GITHUB_PAGES === 'true' || process.env.GITHUB_ACTIONS === 'true'

const nextConfig: NextConfig = {
  // Apply GitHub Pages-specific settings only for Pages builds
  ...(isGithubPages
    ? {
        output: 'export',
        trailingSlash: true,
        basePath: '/Xbon',
        assetPrefix: '/Xbon/',
        images: { unoptimized: true },
        distDir: 'out',
      }
    : {
        // On Vercel/local, use defaults (no basePath/assetPrefix)
      }),
  // Remove tracing override to avoid potential monorepo tracing issues on Vercel; defaults are fine
  // outputFileTracingRoot: process.cwd(),
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
}

export default nextConfig
