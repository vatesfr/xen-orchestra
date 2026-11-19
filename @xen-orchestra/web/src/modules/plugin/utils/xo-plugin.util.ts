import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { fetchPatch } from '@/shared/utils/fetch.util.ts'
import type { RouteLocationAsRelative } from 'vue-router'

export function getPluginDescription(plugin: FrontXoPlugin): string | undefined {
  return plugin.description?.trim()
}

// a plugin never loaded since the server started has no `loaded` state
export function isPluginLoaded(plugin: FrontXoPlugin): boolean {
  return plugin.loaded === true
}

export function updatePluginAutoload(plugin: FrontXoPlugin, autoload: boolean) {
  return fetchPatch(`plugins/${plugin.id}`, { autoload })
}

export function getPluginRoute(pluginId: FrontXoPlugin['id']): RouteLocationAsRelative {
  return {
    name: '/admin/plugin/[id]',
    params: { id: pluginId },
  }
}
