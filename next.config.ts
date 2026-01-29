import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  compress: true, // Enable Gzip/Brotli compression
  reactStrictMode: true,
  poweredByHeader: false, // Security + bit less bytes
  experimental: {
    // reactCompiler: true, // Removed as it causes type error in this version
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion', 'date-fns'], // Tree shake heavy libs
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
