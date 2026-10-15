import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'

export function getPluginDescription(plugin: FrontXoPlugin): string | undefined {
  return plugin.description?.trim()
}
