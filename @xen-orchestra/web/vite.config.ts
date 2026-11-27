import { fileURLToPath, URL } from 'node:url'
import vueI18n from '@intlify/unplugin-vue-i18n/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv, PluginOption } from 'vite'
import vueRouter from 'vue-router/vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const { VITE_XO_REST_HOST } = loadEnv(mode, process.cwd())
  const isDevMode = mode === 'development'

  return {
    base: './',
    plugins: [
      vueRouter({
        dts: isDevMode ? './src/route-map.d.ts' : false,
        exclude: isDevMode ? [] : ['src/pages/dev/**'],
      }),
      vue(),
      vueI18n({
        // The tests run in English only: loading the 22 other locales in each worker costs about 30 % of the run time
        // and memory
        include: fileURLToPath(
          new URL(mode === 'test' ? '../web-core/lib/locales/en.json' : '../web-core/lib/locales/**', import.meta.url)
        ),
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
    optimizeDeps: {
      include: ['value-matcher', 'complex-matcher', 'xo-remote-parser', '@xen-orchestra/cron'],
    },
    test: {
      globals: true,
      // The test files share their modules (see docs/tests/mocking.md): about 7x faster than isolating each file. In a
      // random order, so that a test leaking state into another file fails instead of passing by luck
      isolate: false,
      sequence: { shuffle: { files: true } },
      // More workers are not faster, and each one keeps every module it loaded
      maxWorkers: 4,
      setupFiles: ['./src/test/global-module-mocks.ts', './src/test/setup.ts'],
      // From Node 25, the `localStorage` of Node hides the one of happy-dom, and is undefined in the tests
      execArgv: ['--no-experimental-webstorage'],
      alias: {
        '@core-test': fileURLToPath(new URL('../web-core/test', import.meta.url)),
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
  }
})
