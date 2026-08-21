import { fileURLToPath, URL } from 'node:url'
import vueI18n from '@intlify/unplugin-vue-i18n/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig, PluginOption } from 'vite'

export default defineConfig({
  plugins: [
    vue(),
    vueI18n({
      include: fileURLToPath(new URL('./lib/locales/**', import.meta.url)),
    }),
  ] as PluginOption[],
  // The prebundled `vue-i18n` runtime build is emitted with a broken chunk order
  // (`init_shared_esm_bundler is not defined`), so it has to be served unbundled.
  optimizeDeps: {
    exclude: ['vue-i18n'],
  },
  resolve: {
    alias: {
      '@core': fileURLToPath(new URL('./lib', import.meta.url)),
    },
    dedupe: ['vue', 'pinia', 'vue-router'],
  },
})
