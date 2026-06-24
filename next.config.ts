import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    // TypeScript errors are checked during development — don't suppress them at build
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
};

export default nextConfig;
