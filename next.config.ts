/** @type {import('next').NextConfig} */
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  
  // Important fixes for pdfjs-dist
  webpack: (config, { isServer }) => {
    // TypeScript type definition check errors se bachne ke liye
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      canvas: false, // Node.js canvas module ko browser build me mock karne ke liye
    };
    return config;
  },

  // Optional: Better performance
  experimental: {
    optimizePackageImports: ['pdfjs-dist'],
  },
};

export default nextConfig;
