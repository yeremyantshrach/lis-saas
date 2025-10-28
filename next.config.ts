import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: [
    "@react-email/components",
    "@react-email/tailwind",
    "@react-email/render",
  ],
};

export default nextConfig;
