import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: [
      '192.168.1.6:3000',
      '192.168.1.6',
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "localhost",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "192.168.1.6",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "192.168.1.6",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;