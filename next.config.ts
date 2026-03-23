import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Force Next.js to use Webpack instead of Turbopack
  experimental: {
    webpackBuildWorker: true,
  },

  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
};

export default nextConfig;
