/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@si-learning/shared'],
  
  // Static export for Vercel
  output: 'export',
  distDir: 'dist',
  
  // Image optimization (required for static export)
  images: {
    unoptimized: true,
  },
  
  // Environment variables for demo mode
  env: {
    NEXT_PUBLIC_DEMO_MODE: 'true',
    NEXT_PUBLIC_API_URL: '',
  },
};

module.exports = nextConfig;
