import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'path'
import vueI18n from '@intlify/unplugin-vue-i18n/vite'
import vue from '@vitejs/plugin-vue'
import vueRouter from 'unplugin-vue-router/vite'
import { defineConfig, loadEnv } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const { VITE_XO_REST_HOST } = loadEnv(mode, process.cwd())

  return {
    base: './',
    plugins: [
      vueRouter({
        exclude: mode !== 'development' ? ['src/pages/dev/**'] : [],
      }),
      vue(),
      vueI18n({
        include: [resolve(__dirname, 'src/locales/**'), resolve(__dirname, '../web-core/lib/locales/**')],
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@core': fileURLToPath(new URL('../web-core/lib', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: `ws://${VITE_XO_REST_HOST}`,
          ws: true,
        },
        '/rest': {
          target: `http://${VITE_XO_REST_HOST}`,
        },
      },
    },
  }
})
