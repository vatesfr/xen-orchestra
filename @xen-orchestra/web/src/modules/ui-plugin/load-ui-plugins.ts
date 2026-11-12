import {
  UI_PLUGIN_API_VERSION,
  type UiPluginManifest,
  type XoUiPlugin,
} from '@/modules/ui-plugin/types/ui-plugin.type.ts'
import { registerUiPlugin } from '@/modules/ui-plugin/ui-plugin.registry.ts'
import i18n from '@core/i18n.ts'
import { loadRemote, registerRemotes } from '@module-federation/runtime'
import type { Router } from 'vue-router'

// The app is not mounted until UI plugins are loaded: an unreachable plugin must not block XO6 for too long
const LOAD_TIMEOUT_MS = 10_000

const EXPOSED_MODULE = 'plugin'

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms)

    promise.then(resolve, reject).finally(() => clearTimeout(timeout))
  })
}

function assertIsUiPlugin(manifest: UiPluginManifest, plugin: unknown): asserts plugin is XoUiPlugin {
  if (typeof plugin !== 'object' || plugin === null || !('apiVersion' in plugin) || !('name' in plugin)) {
    throw new Error(`"${manifest.name}/${EXPOSED_MODULE}" does not export a UI plugin as default export`)
  }

  if (plugin.apiVersion !== UI_PLUGIN_API_VERSION) {
    throw new Error(
      `UI plugin "${String(plugin.name)}" targets API version ${String(plugin.apiVersion)}, XO6 provides version ${UI_PLUGIN_API_VERSION}`
    )
  }
}

function installUiPlugin(plugin: XoUiPlugin, router: Router) {
  registerUiPlugin(plugin)

  plugin.routes?.forEach(route => router.addRoute(route))

  Object.entries(plugin.messages ?? {}).forEach(([locale, messages]) =>
    i18n.global.mergeLocaleMessage(locale, messages as any)
  )
}

async function loadUiPlugin(manifest: UiPluginManifest, router: Router) {
  const module = await withTimeout(
    loadRemote<{ default: unknown }>(`${manifest.name}/${EXPOSED_MODULE}`),
    LOAD_TIMEOUT_MS
  )

  const plugin = module?.default

  assertIsUiPlugin(manifest, plugin)

  installUiPlugin(plugin, router)
}

/**
 * Loads the UI plugins (Module Federation remotes) and installs them in the app.
 *
 * Must be called before the router is installed, so that the initial navigation can target a plugin route.
 * A plugin that fails to load is skipped: XO6 still starts without it.
 */
export async function loadUiPlugins(manifests: UiPluginManifest[], router: Router) {
  if (manifests.length === 0) {
    return
  }

  registerRemotes(manifests.map(({ name, entry }) => ({ name, entry, type: 'module' })))

  await Promise.all(
    manifests.map(async manifest => {
      try {
        await loadUiPlugin(manifest, router)
      } catch (error) {
        console.error(`Failed to load UI plugin "${manifest.name}" from ${manifest.entry}`, error)
      }
    })
  )
}
