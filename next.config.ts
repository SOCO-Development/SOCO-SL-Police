import type { NextConfig } from "next";
import { networkInterfaces } from "os";
import { getNextBasePath } from "./lib/publicAsset";

const basePath = getNextBasePath();

function getLocalNetworkIPs(): string[] {
  const ips = new Set<string>();
  for (const nets of Object.values(networkInterfaces())) {
    for (const net of nets ?? []) {
      const family = net.family as string | number;
      const isIPv4 = family === "IPv4" || family === 4;
      if (isIPv4 && !net.internal) {
        ips.add(net.address);
      }
    }
  }
  return [...ips];
}

const extraDevOrigins =
  process.env.ALLOWED_DEV_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export', // enables static export
  // Export every route as a folder with index.html (e.g. /home/index.html) so IIS
  // can serve it directly on refresh / back / forward without a Node server.
  trailingSlash: true,
  ...(basePath ? { basePath } : {}),
  // Serve images directly from /public so deployments without Next image optimizer still work.
  images: {
    unoptimized: true,
  },
  // Allow HMR when opening the dev server via this machine's LAN IP (see npm run dev banner).
  allowedDevOrigins: ["localhost", "127.0.0.1", ...getLocalNetworkIPs(), ...extraDevOrigins],
  // Turn barrel imports (e.g. `import { X } from 'phosphor-react'`) into direct
  // per-icon imports. Speeds up dev compile and trims the production bundle.
  experimental: {
    optimizePackageImports: ["phosphor-react", "react-icons", "lucide-react", "recharts"],
  },
};

export default nextConfig;