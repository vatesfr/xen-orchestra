import type { TreeNodeBase } from '@core/packages/tree/tree-node-base.ts'
import type { TreeNodeDefinition } from '@core/packages/tree/types.ts'
import type { Component, ComputedRef, Ref } from 'vue'
import type { RouteLocationNormalizedLoaded, RouteRecordRaw } from 'vue-router'

/**
 * Version of the contract between XO6 and its UI plugins (`XoUiPlugin` and the SDK exposed in `sdk.ts`).
 *
 * Bump it on any breaking change: plugins built against another version are refused at load time.
 */
export const UI_PLUGIN_API_VERSION = 1

export type UiPluginApiVersion = typeof UI_PLUGIN_API_VERSION

export type UiPluginTreeDefinitions = {
  definitions: ComputedRef<TreeNodeDefinition[]>
  isReady: Readonly<Ref<boolean>>
}

export type UiPluginTree = {
  /**
   * Composable called in the navigation tree setup. The returned definitions are appended after the site tree.
   */
  useDefinitions: (predicate: (node: TreeNodeBase) => boolean | undefined) => UiPluginTreeDefinitions

  /**
   * Component used to render the tree nodes of each discriminator handled by the plugin.
   *
   * The component receives the tree node in its `node` prop.
   */
  itemComponents: Record<string, Component>

  /**
   * Returns the id of the tree node matching the current route, for routes that don't have an `id` param.
   */
  getActiveNodeId?: (route: RouteLocationNormalizedLoaded) => string | undefined
}

export type UiPluginMessages = Record<string, Record<string, unknown>>

export type XoUiPlugin = {
  name: string
  apiVersion: UiPluginApiVersion
  routes?: RouteRecordRaw[]
  /**
   * Translations by locale, merged into the global i18n instance.
   *
   * Must be precompiled (e.g. with `@intlify/unplugin-vue-i18n`) since XO6 uses the runtime-only build of vue-i18n.
   */
  messages?: UiPluginMessages
  tree?: UiPluginTree
}

export type UiPluginManifest = {
  /** Module Federation name of the remote */
  name: string
  /** URL of the remote entry (`remoteEntry.js`) */
  entry: string
}
