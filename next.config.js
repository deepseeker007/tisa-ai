/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,

  // Fix ESM-only packages that Next.js CJS bundler can't handle directly
  transpilePackages: [
    'react-markdown',
    'remark-gfm',
    'remark-parse',
    'remark-rehype',
    'rehype-stringify',
    'unified',
    'bail',
    'is-plain-obj',
    'trough',
    'vfile',
    'vfile-message',
    'unist-util-stringify-position',
    'mdast-util-from-markdown',
    'mdast-util-to-hast',
    'mdast-util-gfm',
    'micromark',
    'decode-named-character-reference',
    'character-entities',
    'idb',
  ],

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    // Allow WASM (needed by @xenova/transformers and WebLLM)
    config.experiments = { ...config.experiments, asyncWebAssembly: true };

    // Silence critical dep warnings from transformers.js
    config.module = config.module ?? {};
    config.module.exprContextCritical = false;

    return config;
  },

  // COOP/COEP headers required for SharedArrayBuffer (WebGPU / WebLLM)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Opener-Policy',   value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy',  value: 'require-corp' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
