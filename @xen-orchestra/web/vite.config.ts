import { execFileSync } from 'child_process'
import { fileURLToPath, URL } from 'node:url'
import vueI18n from '@intlify/unplugin-vue-i18n/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv, PluginOption } from 'vite'
import vueRouter from 'vue-router/vite'

// TODO: replace XOA_PLAN with a proper build value once implemented.
const XOA_PLAN = process.env.XOA_PLAN ?? '5'
const GIT_HEAD = execFileSync('git', ['rev-parse', 'HEAD']).toString().trim()

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const { VITE_XO_REST_HOST } = loadEnv(mode, process.cwd())

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
    ] as PluginOption[],
    define: {
      XO_XOA_PLAN: JSON.stringify(Number(XOA_PLAN)),
      XO_GIT_HEAD: JSON.stringify(GIT_HEAD),
    },
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
      include: ['value-matcher', 'complex-matcher'],
    },
  }
})
