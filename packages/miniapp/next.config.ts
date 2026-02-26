import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // На Vercel Output Directory настроен как "packages/miniapp/.next",
  // поэтому собираем Next.js именно туда, чтобы путь совпадал.
  distDir: process.env.VERCEL ? 'packages/miniapp/.next' : '.next',
  webpack: (config, { isServer }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
      topLevelAwait: true
    };

    config.optimization.moduleIds = 'named';

    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    });

    // Добавляем полифиллы для браузера
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer/'),
        util: require.resolve('util/'),
        'text-encoding': require.resolve('text-encoding'),
      };
    }

    return config;
  },
};

export default nextConfig;