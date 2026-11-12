import type { XoUiPlugin } from '@/modules/ui-plugin/types/ui-plugin.type.ts'
import type { Component } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

// UI plugins are all loaded before the app is mounted, so the registry doesn't need to be reactive
const uiPlugins: XoUiPlugin[] = []

export function registerUiPlugin(plugin: XoUiPlugin) {
  if (uiPlugins.some(({ name }) => name === plugin.name)) {
    throw new Error(`UI plugin "${plugin.name}" is already registered`)
  }

  uiPlugins.push(plugin)
}

export function getUiPlugins(): readonly XoUiPlugin[] {
  return uiPlugins
}

export function getUiPluginTreeItemComponent(discriminator: unknown): Component | undefined {
  if (typeof discriminator !== 'string') {
    return undefined
  }

  for (const plugin of uiPlugins) {
    const component = plugin.tree?.itemComponents[discriminator]

    if (component !== undefined) {
      return component
    }
  }

  return undefined
}

export function getUiPluginActiveTreeNodeId(route: RouteLocationNormalizedLoaded): string | undefined {
  for (const plugin of uiPlugins) {
    const nodeId = plugin.tree?.getActiveNodeId?.(route)

    if (nodeId !== undefined) {
      return nodeId
    }
  }

  return undefined
}
