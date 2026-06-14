/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@si-learning/shared'],
  
  // Image optimization
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
