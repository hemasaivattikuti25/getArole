import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // Generates a static HTML/JS export in frontend/out/
  trailingSlash: true, // Exports /page/index.html for robust static host routing (GitHub Pages)
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
