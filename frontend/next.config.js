/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Only use standalone for production builds
  ...(process.env.NODE_ENV === 'production' && { output: 'standalone' }),
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
  },
  // 🔥 OneDrive Compatibility Fixes - OPTIMIERT
  webpack: (config, { dev }) => {
    if (dev) {
      // Weniger aggressive Polling für OneDrive
      config.watchOptions = {
        poll: 2000, // Longer polling interval
        aggregateTimeout: 500,
        ignored: [
          '**/node_modules',
          '**/.git',
          '**/dist'
        ]
      }
      
      // OneDrive-friendly optimizations
      config.snapshot = {
        managedPaths: [],
        immutablePaths: [],
        buildDependencies: {
          hash: false,
          timestamp: true
        }
      }
    }
    return config
  },
  // Stable features only
  experimental: {
    serverComponentsExternalPackages: [],
  },
  async rewrites() {
    // Allow proxying API calls in dev/prod without hardcoding localhost
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://backend:5000';
    let destination = 'http://backend:5000/api/:path*';
    try {
      const url = new URL(apiBase);
      destination = `${url.origin}/api/:path*`;
    } catch {}
    return [
      {
        source: '/api/:path*',
        destination,
      },
    ];
  },
};

module.exports = nextConfig;