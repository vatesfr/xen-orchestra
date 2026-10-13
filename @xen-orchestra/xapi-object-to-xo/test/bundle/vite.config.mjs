import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'url'

// Deliberately bare: no polyfill plugin, no `external`, browser platform.
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  logLevel: 'info',
  build: {
    outDir: fileURLToPath(new URL('../../dist', import.meta.url)),
    emptyOutDir: true,
    minify: false,
    target: 'esnext',
    lib: {
      entry: fileURLToPath(new URL('./entry.mjs', import.meta.url)),
      // iife so the bundle can be executed inside a bare `node:vm` sandbox
      formats: ['es', 'iife'],
      name: 'poc',
      fileName: format => `poc.${format}.js`,
    },
  },
})
