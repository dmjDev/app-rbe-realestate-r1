import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: "/api/images",
        search: "**", // permite cualquier query string
      },
    ],
  },
};

export default nextConfig;
