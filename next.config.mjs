/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Force clean build
  distDir: '.next',
  cleanDistDir: true,
  // Explicitly disable experimental features that can cause RSC issues
  experimental: {
    ppr: false, // Disable Partial Pre-Rendering
  },
  // Move serverComponentsExternalPackages to top level as per Next.js 15
  serverExternalPackages: [],
};

export default nextConfig;
