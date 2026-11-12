import { fileURLToPath, URL } from 'node:url'
import vueI18n from '@intlify/unplugin-vue-i18n/vite'
import { federation } from '@module-federation/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv, PluginOption } from 'vite'
import vueRouter from 'vue-router/vite'
import { exactVueI18nAliasPlugin, getHostSharedConfig, HOST_FEDERATION_NAME } from './federation.config.ts'

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
      // XO6 is the host of the UI plugins (see `src/modules/ui-plugin`), useless in unit tests
      process.env.VITEST === undefined && exactVueI18nAliasPlugin(),
      process.env.VITEST === undefined &&
        federation({
          name: HOST_FEDERATION_NAME,
          remotes: {},
          shared: getHostSharedConfig(),
          dts: false,
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
      include: ['value-matcher', 'complex-matcher', 'xo-remote-parser'],
    },
    test: {
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
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
  }
})
