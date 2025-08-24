/** @type {import('next').NextConfig} */
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Expose a public version string for the service worker to bust cache on each deploy
  // Prefer the provider's commit SHA; fall back to GitHub Actions or timestamp for local/dev
  env: {
    NEXT_PUBLIC_SW_VERSION:
      process.env['VERCEL_GIT_COMMIT_SHA'] ||
      process.env['GITHUB_SHA'] ||
      process.env['COMMIT_SHA'] ||
      String(Date.now()),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
