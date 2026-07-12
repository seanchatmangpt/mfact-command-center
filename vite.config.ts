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
      include: ['buffer', 'crypto', 'stream', 'util', 'events', 'path'],
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
    target: 'esnext'
  },
  resolve: {
    alias: {
      '@unrdf/core': '/Users/sac/unrdf/packages/core/src/index.mjs',
      '@unrdf/core/rdf/n3-justified-only': '/Users/sac/unrdf/packages/core/src/rdf/n3-justified-only.mjs',
      '@unrdf/core/rdf/parsers.mjs': '/Users/sac/unrdf/packages/core/src/rdf/parsers.mjs',
      '@unrdf/core/rdf/parsers.schema.mjs': '/Users/sac/unrdf/packages/core/src/rdf/parsers.schema.mjs',
      '@unrdf/core/rdf/canonicalize.mjs': '/Users/sac/unrdf/packages/core/src/rdf/canonicalize.mjs',
      '@unrdf/oxigraph': '/Users/sac/unrdf/packages/oxigraph/src/index.mjs'
    }
  }
})
