import { fileURLToPath, URL } from 'node:url'
import vueI18n from '@intlify/unplugin-vue-i18n/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    vue(),
    vueI18n({
      include: fileURLToPath(new URL('./lib/locales/**', import.meta.url)),
    }),
  ],
  resolve: {
    alias: {
      '@core': fileURLToPath(new URL('./lib', import.meta.url)),
      '@core-test': fileURLToPath(new URL('./test', import.meta.url)),
    },
  },
  test: {
    globals: true,
    setupFiles: ['./test/setup.ts'],
    alias: {
      // `placement.js` only declares a `module` entry, which the Node-style resolution used by Vitest ignores
      'placement.js': fileURLToPath(new URL('../../node_modules/placement.js/dist/index.es.js', import.meta.url)),
    },
    projects: [
      {
        extends: true,
        test: {
          include: ['**/*.unit.{test,spec}.ts'],
          name: 'unit',
          environment: 'happy-dom',
        },
      },
    ],
  },
})
