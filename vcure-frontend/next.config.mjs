/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  eslint: {
    ignoreDuringBuilds: true
  },
  images: {
    formats: ["image/webp"]
  }
};

export default nextConfig;


