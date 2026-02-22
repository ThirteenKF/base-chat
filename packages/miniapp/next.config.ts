import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Включаем поддержку WebAssembly
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Добавляем правило для .wasm файлов
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    // Для клиентской части отключаем node-модули
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        path: false,
        os: false,
      };
    }

    return config;
  },
};

export default nextConfig;