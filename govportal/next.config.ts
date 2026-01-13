import type { NextConfig } from "next";

const devOrigins = process.env.DEV_ORIGINS?.split(",") ?? [];
const imageHosts = process.env.IMAGE_HOSTS?.split(",") ?? [];

const nextConfig: NextConfig = {
  reactCompiler: true,

  allowedDevOrigins: devOrigins,

  images: {
    remotePatterns: imageHosts.flatMap((host) => ([
      { protocol: "http", hostname: host, pathname: "/**" },
      { protocol: "https", hostname: host, pathname: "/**" },
    ])),
  },
};

export default nextConfig;
