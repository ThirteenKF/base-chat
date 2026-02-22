import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Включаем поддержку WebAssembly
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Правило для .wasm файлов
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    // Для клиентской части добавляем полифиллы
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        path: false,
        os: false,
      };
    }

    // Добавляем поддержку top-level await
    config.output.environment = {
      ...config.output.environment,
      asyncFunction: true,
    };

    return config;
  },
};

export default nextConfig;