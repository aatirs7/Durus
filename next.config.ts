import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // The password gate used to live here. Anything still pointing at
      // it, a bookmark or an open tab, lands on Today instead of a 404.
      { source: "/unlock", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
