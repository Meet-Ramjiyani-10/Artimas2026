import type { NextConfig } from 'next';

import path from 'path';

// Backend target URL for proxying API requests
const rawBackend = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const backendOrigin = rawBackend.replace(/\/api\/?$/, '').replace(/\/+$/, '');

const config: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
};

export default config;
