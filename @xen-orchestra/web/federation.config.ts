// Module Federation configuration shared by XO6 (host) and its UI plugins (remotes)
//
// XO6 provides the libraries below, `@xen-orchestra/web-core` and its UI plugin SDK to the plugins as singletons: a
// plugin always uses the instances living in XO6 (same Vue app, router, stores, i18n, injection keys…) and never
// bundles its own copy.

import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { Alias, Plugin } from 'vite'

export const HOST_FEDERATION_NAME = 'xo_web'

export const UI_PLUGIN_SDK_SHARE_KEY = '@xen-orchestra/web/ui-plugin-sdk'

const UI_PLUGIN_SDK_PATH = fileURLToPath(new URL('./src/modules/ui-plugin/sdk.ts', import.meta.url))

const WEB_CORE_SHARE_PREFIX = '@xen-orchestra/web-core/'

const WEB_CORE_LIB_PATH = fileURLToPath(new URL('../web-core/lib/', import.meta.url))

// `@intlify/unplugin-vue-i18n` aliases `vue-i18n` to its runtime-only build: the alias target is what gets shared (see
// `exactVueI18nAliasPlugin`)
const VUE_I18N_RUNTIME = 'vue-i18n/dist/vue-i18n.runtime.esm-bundler.js'

// Libraries holding global state, or installed on the Vue app by XO6.
//
// A shared library is provided as a whole, without tree-shaking: stateless libraries (e.g. `@vueuse/*`) are not
// shared, a plugin bundles what it uses.
const SHARED_LIBRARIES = ['vue', 'vue-router', 'pinia', VUE_I18N_RUNTIME, '@regle/core']

type SharedConfig = {
  singleton: true
  import?: string | false
  requiredVersion?: false
}

function listWebCoreModules() {
  return readdirSync(WEB_CORE_LIB_PATH, { recursive: true, encoding: 'utf8' })
    .map(file => file.replaceAll('\\', '/'))
    .filter(file => /\.(ts|vue)$/.test(file) && !/\.(d|unit\.test|test|spec)\.ts$/.test(file))
    .sort()
}

/**
 * Shared modules provided by XO6.
 *
 * Every `@xen-orchestra/web-core` module is listed with its actual path: XO6 imports them with the `@core` alias, so
 * providing the very same file guarantees that XO6 and its plugins share the same module instance.
 */
export function getHostSharedConfig(): Record<string, SharedConfig> {
  return {
    ...Object.fromEntries(SHARED_LIBRARIES.map(library => [library, { singleton: true }])),
    ...Object.fromEntries(
      listWebCoreModules().map(file => [
        `${WEB_CORE_SHARE_PREFIX}${file}`,
        { singleton: true, import: `${WEB_CORE_LIB_PATH}${file}` },
      ])
    ),
    [UI_PLUGIN_SDK_SHARE_KEY]: { singleton: true, import: UI_PLUGIN_SDK_PATH },
  }
}

/**
 * Shared modules consumed by a UI plugin: they are never bundled in the plugin, XO6 must provide them.
 *
 * The compatibility between XO6 and a plugin is checked with `UI_PLUGIN_API_VERSION`, not with the versions of
 * `@xen-orchestra/web` and `@xen-orchestra/web-core`.
 */
export function getRemoteSharedConfig(): Record<string, SharedConfig> {
  return {
    ...Object.fromEntries(SHARED_LIBRARIES.map(library => [library, { singleton: true, import: false }])),
    [WEB_CORE_SHARE_PREFIX]: { singleton: true, import: false, requiredVersion: false },
    [UI_PLUGIN_SDK_SHARE_KEY]: { singleton: true, import: false, requiredVersion: false },
  }
}

/**
 * `@intlify/unplugin-vue-i18n` aliases `vue-i18n` to `vue-i18n/dist/vue-i18n.runtime.esm-bundler.js`, but a string alias
 * also matches subpaths: the shared module would be rewritten to `vue-i18n/dist/…/dist/vue-i18n.runtime.esm-bundler.js`.
 *
 * This plugin restricts the alias to the exact `vue-i18n` specifier. It must be added after `vueI18n()`.
 */
export function exactVueI18nAliasPlugin(): Plugin {
  return {
    name: 'xo:exact-vue-i18n-alias',
    enforce: 'post',
    config(config) {
      const alias = config.resolve?.alias

      if (alias === undefined) {
        return
      }

      const aliases: Alias[] = Array.isArray(alias)
        ? alias
        : Object.entries(alias).map(([find, replacement]) => ({ find, replacement }))

      config.resolve!.alias = aliases.map(entry =>
        entry.find === 'vue-i18n' ? { ...entry, find: /^vue-i18n$/ } : entry
      )
    },
  }
}
