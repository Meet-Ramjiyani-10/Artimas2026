import type { NextConfig } from 'next';

import path from 'path';

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
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },
};

export default config;
