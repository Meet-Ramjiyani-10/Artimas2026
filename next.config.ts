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
};

export default config;
