import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required so Turbopack doesn't complain
  turbopack: {},

  // Enable SVG → React component support
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
};

export default nextConfig;
