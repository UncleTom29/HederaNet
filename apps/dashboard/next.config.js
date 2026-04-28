/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@hederanet/ui", "@hederanet/sdk"],
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "@hashgraph/sdk"],
  },
};

module.exports = nextConfig;
