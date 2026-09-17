import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

// https://vite.dev/config/
export default defineConfig({
  base: '/mfact-command-center/',
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'crypto', 'stream', 'util', 'events', 'path', 'process', 'fs'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
    // @ts-ignore
    wasm(),
    // @ts-ignore
    topLevelAwait()
  ],
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 10000,
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.message.includes('is not exported by "__vite-browser-external"')) return;
        warn(warning);
      }
    }
  },
  resolve: {
    alias: {
      '@unrdf/core': '/Users/sac/unrdf/packages/core/src/index.mjs',
      '@unrdf/core/rdf/n3-justified-only': '/Users/sac/unrdf/packages/core/src/rdf/n3-justified-only.mjs',
      '@unrdf/core/rdf/parsers.mjs': '/Users/sac/unrdf/packages/core/src/rdf/parsers.mjs',
      '@unrdf/core/rdf/parsers.schema.mjs': '/Users/sac/unrdf/packages/core/src/rdf/parsers.schema.mjs',
      '@unrdf/core/rdf/canonicalize.mjs': '/Users/sac/unrdf/packages/core/src/rdf/canonicalize.mjs',
      '@unrdf/oxigraph': '/Users/sac/unrdf/packages/oxigraph/src/index.mjs',
      '@unrdf/kgc-4d': '/Users/sac/unrdf/packages/kgc-4d/src/index.mjs',
      'vite-plugin-node-polyfills/shims/process': '/Users/sac/mfact/web/mfact-ui/node_modules/vite-plugin-node-polyfills/shims/process',
      'vite-plugin-node-polyfills/shims/buffer': '/Users/sac/mfact/web/mfact-ui/node_modules/vite-plugin-node-polyfills/shims/buffer',
      'vite-plugin-node-polyfills/shims/global': '/Users/sac/mfact/web/mfact-ui/node_modules/vite-plugin-node-polyfills/shims/global'
    }
  }
})
