import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";

export const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
      { key: "Referrer-Policy", value: "no-referrer" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=()"
      },
      {
        key: "Content-Security-Policy",
        value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'"
      },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload"
      }
    ];
    return [
      {
        source: "/(.*)",
        headers: securityHeaders
      },
      {
        source: "/dashboard/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }]
      },
      {
        source: "/api/media/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }]
      },
      {
        source: "/api/uploads",
        headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }]
      },
      {
        source: "/api/chat",
        headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }]
      },
      {
        source: "/api/research/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }]
      }
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb"
    }
  }
};

export default withWorkflow(nextConfig);
