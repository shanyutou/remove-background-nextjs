import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack configuration (Next.js 16+ default)
  // Empty config to suppress warnings, Turbopack handles WASM natively
  turbopack: {},

  // Webpack configuration for WASM and ONNX Runtime support
  webpack: (config, { isServer }) => {
    // Disable Node.js-specific modules for client-side bundles
    config.resolve.alias = {
      ...config.resolve.alias,
      // Prevent sharp and onnxruntime-node from being bundled on the client side
      "sharp$": false,
      "onnxruntime-node$": false,
    };

    // Handle WASM files
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Enable WASM MIME type handling
    if (!isServer) {
      config.output = {
        ...config.output,
        webassemblyModuleFilename: 'static/wasm/[modulehash].wasm',
      };
    }

    return config;
  },
};

export default nextConfig;
