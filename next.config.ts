import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "export" removed — server-side API routes require Node.js runtime.
  // Netlify deploys this as a Next.js SSR app via @netlify/plugin-nextjs.
};

export default nextConfig;
