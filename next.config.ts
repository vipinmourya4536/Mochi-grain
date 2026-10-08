import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* Allow the sandbox preview hosts to load /_next/* dev assets without
     triggering the cross-origin dev warning (Next dev-tools "Issue" badge). */
  allowedDevOrigins: ["preview-chat-*.space-z.ai"],
  /* The floating dev-tools indicator bubble overlaps the bottom-left nav
     item at mobile widths — disable it (dev-only, no production impact). */
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
