import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  headers: async () => {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "connect-src 'self' api.github.com *.googleapis.com *.firebaseio.com *.firestore.googleapis.com",
              "frame-src *",
              "img-src * data:",
              "font-src 'self' fonts.gstatic.com",
              "style-src 'self' fonts.googleapis.com 'unsafe-inline'",
            ].join("; "),
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  allowedDevOrigins: ["192.168.1.12", "192.168.1.7", "192.168.0.150", "192.168.1.11"],
};

export default nextConfig;
