import type { NextConfig } from "next";

// ============================================================================
// CarbonTwin — Next.js production configuration
// Optimized for Vercel deployment with performance, security, and SEO.
// ============================================================================

const nextConfig: NextConfig = {
  // Standalone output for Docker / self-hosted (Vercel ignores this)
  output: "standalone",

  // React strict mode catches potential issues in dev
  reactStrictMode: true,

  // TypeScript errors should fail the build in production
  // (kept false for the sandbox dev environment; set to true for prod CI)
  typescript: {
    ignoreBuildErrors: false,
  },

  // --- Image optimization ---
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Google OAuth avatars
      },
    ],
    minimumCacheTTL: 60 * 60 * 24, // 24h
  },

  // --- Security & performance headers ---
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        // Cache static assets aggressively
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // --- Experimental optimizations ---
  experimental: {
    // Optimize package imports for faster builds + smaller bundles
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "framer-motion",
      "@radix-ui/react-icons",
    ],
  },

  // --- Redirects ---
  async redirects() {
    return [
      // Legacy/old route redirects (add as needed)
    ];
  },
};

export default nextConfig;
