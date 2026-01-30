/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  
  // Production optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // Environment variables exposed to browser
  env: {
    NEXT_PUBLIC_NETWORK: process.env.NEXT_PUBLIC_NETWORK || 'devnet',
  },

  webpack: (config, { isServer }) => {
    // Provide Buffer globally for browser
    if (!isServer) {
      config.plugins.push(
        new (require('webpack')).ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
        })
      );
    }

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      stream: false,
      events: false,
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
