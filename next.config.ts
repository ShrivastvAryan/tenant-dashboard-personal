import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack is used via CLI flag --turbopack
  ...(process.platform === "win32" ? {} : { output: "standalone" }),
  poweredByHeader: false, // Removes "X-Powered-By" header
};

export default nextConfig;
