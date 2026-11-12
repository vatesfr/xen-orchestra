/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import vueI18n from '@intlify/unplugin-vue-i18n/vite'
import { federation } from '@module-federation/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig, type Plugin, type PluginOption } from 'vite'
import vueRouter from 'vue-router/vite'
import { exactVueI18nAliasPlugin, getRemoteSharedConfig, UI_PLUGIN_SDK_SHARE_KEY } from '../web/federation.config.ts'

const SRC_PATH = fileURLToPath(new URL('./src/', import.meta.url))
const LOCALES_PATH = fileURLToPath(new URL('./src/locales/**', import.meta.url))
const WEB_SRC_PATH = fileURLToPath(new URL('../web/src/', import.meta.url))
const WEB_CORE_LIB_PATH = fileURLToPath(new URL('../web-core/lib/', import.meta.url))
const WEB_CORE_LOCALES_PATH = fileURLToPath(new URL('../web-core/lib/locales/**', import.meta.url))
const UI_PLUGIN_SDK_PATH = fileURLToPath(new URL('../web/src/modules/ui-plugin/sdk.ts', import.meta.url))

const IS_TEST = process.env.VITEST !== undefined

/**
 * In unit tests, the plugin runs without XO6, which is imported directly: `@/` must be resolved in the sources of the
 * package of the importer.
 */
function testAliasPlugin(): Plugin {
  return {
    name: 'xo-kubernetes:test-alias',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!source.startsWith('@/')) {
        return
      }

      const base = importer?.startsWith(WEB_SRC_PATH) ? WEB_SRC_PATH : SRC_PATH

      return this.resolve(`${base}${source.slice(2)}`, importer, { skipSelf: true })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    IS_TEST && testAliasPlugin(),
    vueRouter({
      dts: './src/route-map.d.ts',
    }),
    vue(),
    vueI18n({
      // In unit tests, `@core/i18n.ts` gets its messages from this plugin
      include: IS_TEST ? [WEB_CORE_LOCALES_PATH, LOCALES_PATH] : LOCALES_PATH,
    }),
    !IS_TEST && exactVueI18nAliasPlugin(),
    !IS_TEST &&
      federation({
        name: 'xo_kubernetes',
        filename: 'remoteEntry.js',
        exposes: {
          './plugin': './src/plugin.ts',
        },
        shared: getRemoteSharedConfig(),
        dts: false,
      }),
  ] as PluginOption[],
  resolve: {
    alias: IS_TEST
      ? {
          '@core': WEB_CORE_LIB_PATH,
          [UI_PLUGIN_SDK_SHARE_KEY]: UI_PLUGIN_SDK_PATH,
        }
      : [
          { find: /^@\//, replacement: SRC_PATH },
          // Bare specifier, so that Module Federation provides the instance living in XO6
          { find: /^@core\/(.+\.(?:ts|vue))$/, replacement: '@xen-orchestra/web-core/$1' },
          // Barrel files (e.g. `@core/packages/job`)
          { find: /^@core\/(.+)$/, replacement: '@xen-orchestra/web-core/$1/index.ts' },
        ],
  },
  build: {
    // There is no HTML page: the only entry is the remote entry added by Module Federation
    rolldownOptions: {
      input: {},
    },
  },
  preview: {
    cors: true,
  },
  test: {
    globals: true,
    setupFiles: [`${WEB_SRC_PATH}test/setup.ts`],
    alias: {
      // `placement.js` only declares a `module` entry, which the Node-style resolution used by Vitest ignores
      'placement.js': fileURLToPath(new URL('../../node_modules/placement.js/dist/index.es.js', import.meta.url)),
    },
    include: ['**/*.unit.{test,spec}.ts'],
    environment: 'happy-dom',
  },
})
