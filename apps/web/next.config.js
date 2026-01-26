/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      stream: false,
      events: false,
      buffer: false,
    };

    // Suppress critical dependency warnings from wallet adapter dependencies
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /web-worker/, message: /Critical dependency/ },
      { module: /ffjavascript/, message: /Critical dependency/ },
      { module: /pino/, message: /Can't resolve 'pino-pretty'/ },
    ];

    return config;
  },
  transpilePackages: [
    '@solana/wallet-adapter-react',
    '@solana/wallet-adapter-react-ui',
    '@solana/wallet-adapter-base',
    '@solana/wallet-adapter-wallets',
  ],
};

module.exports = nextConfig;
