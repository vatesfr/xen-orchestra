import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { fetchPatch } from '@/shared/utils/fetch.util.ts'

export function updatePluginAutoload(plugin: FrontXoPlugin, autoload: boolean) {
  return fetchPatch(`plugins/${plugin.id}`, { autoload })
}

export async function syncPluginAutoload(plugin: FrontXoPlugin, autoload: boolean) {
  try {
    await updatePluginAutoload(plugin, autoload)
  } catch (error) {
    console.error('Error when updating the autoload of the plugin:', error)
  }
}
