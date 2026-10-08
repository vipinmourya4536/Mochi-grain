import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* Allow the sandbox preview hosts to load /_next/* dev assets without
     triggering the cross-origin dev warning (Next dev-tools "Issue" badge). */
  allowedDevOrigins: ["preview-chat-*.space-z.ai"],
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
