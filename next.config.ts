import type { NextConfig } from "next";

const isVercel = Boolean(process.env.VERCEL);

const nextConfig: NextConfig = {
  // Turbopack is used via CLI flag --turbopack
  // Disable standalone mode on Vercel deployments as Vercel expects standard build artifacts
  ...(isVercel || process.platform === "win32" ? {} : { output: "standalone" }),
  poweredByHeader: false, // Removes "X-Powered-By" header
};

export default nextConfig;
