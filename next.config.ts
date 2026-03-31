import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Serve images directly from /public so deployments without Next image optimizer still work.
  images: {
    unoptimized: true,
  },
  // Allow cross-origin requests from network IPs during development
  // This is useful when accessing the dev server from other devices on your network
  allowedDevOrigins: [
    '192.168.8.100', // Your current network IP
    'localhost',
    '127.0.0.1',
  ],
};

export default nextConfig;