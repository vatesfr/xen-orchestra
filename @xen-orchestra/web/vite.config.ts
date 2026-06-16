import { fileURLToPath, URL } from 'node:url'
import vueI18n from '@intlify/unplugin-vue-i18n/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv, PluginOption } from 'vite'
import vueRouter from 'vue-router/vite'
import { mockRestPlugin } from './dev/mock-rest-plugin.ts'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const { VITE_XO_REST_HOST } = loadEnv(mode, process.cwd())

  const isMockEnabled = process.env.XO_MOCK === '1'

  return {
    base: './',
    plugins: [
      vueRouter({
        dts: './src/route-map.d.ts',
        exclude: mode !== 'development' ? ['src/pages/dev/**'] : [],
      }),
      vue(),
      vueI18n({
        include: fileURLToPath(new URL('../web-core/lib/locales/**', import.meta.url)),
      }),
      ...(isMockEnabled ? [mockRestPlugin()] : []),
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
    optimizeDeps: {
      include: ['value-matcher', 'complex-matcher', 'human-format'],
    },
  }
})
