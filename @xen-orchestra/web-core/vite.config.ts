import { fileURLToPath, URL } from 'node:url'
import vueI18n from '@intlify/unplugin-vue-i18n/vite'
import vue from '@vitejs/plugin-vue'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig, PluginOption } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueI18n({
      include: fileURLToPath(new URL('./lib/locales/**', import.meta.url)),
    }),
  ] as PluginOption[],
  resolve: {
    alias: {
      '@core': fileURLToPath(new URL('./lib', import.meta.url)),
    },
  },
  test: {
    globals: true,
    projects: [
      {
        extends: true,
        test: {
          include: ['**/*.unit.{test,spec}.ts'],
          name: 'unit',
          environment: 'happy-dom',
        },
      },
      {
        extends: true,
        test: {
          include: ['**/*.browser.{test,spec}.ts'],
          name: 'browser',
          setupFiles: ['./lib/test/setup-browser.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
})
