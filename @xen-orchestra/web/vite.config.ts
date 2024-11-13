import { fileURLToPath, URL } from 'node:url'
import vueI18n from '@intlify/unplugin-vue-i18n/vite'
import vue from '@vitejs/plugin-vue'
import vueRouter from 'unplugin-vue-router/vite'
import { defineConfig, loadEnv, PluginOption } from 'vite'

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
        include: [
          fileURLToPath(new URL('./src/locales/**', import.meta.url)),
          fileURLToPath(new URL('../web-core/lib/locales/**', import.meta.url)),
        ],
      }),
    ] as PluginOption[],
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
