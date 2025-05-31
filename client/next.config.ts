import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
 images: {
    domains: [
      'upload.wikimedia.org', "example.com","avatars.githubusercontent.com", "flagsapi.com"
    ],
  },
};

export default nextConfig;
