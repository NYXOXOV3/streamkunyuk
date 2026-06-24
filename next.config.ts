import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for VPS/cPanel deployments.
  // Vercel ignores this and uses its own serverless output.
  output: "standalone",
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  // Vercel-specific: allow larger response bodies for streaming
  serverExternalPackages: [],
  // Image optimization (requires sharp on Vercel, included automatically)
  images: {
    unoptimized: false,
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  // Skip trailing slash redirect
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
