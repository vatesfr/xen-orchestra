import { useXoSiteTreeDefinitions } from '@/modules/site/composables/xo-site-tree-definitions.composable.ts'
import { getUiPlugins } from '@/modules/ui-plugin/ui-plugin.registry.ts'
import { useTreeCollapse } from '@core/composables/tree-collapse.composable.ts'
import { useTreeFilter } from '@core/composables/tree-filter.composable.ts'
import { useTree } from '@core/packages/tree/use-tree.ts'
import { computed } from 'vue'

export function useNavigationTree() {
  const { filter, predicate, isSearching, hasFilter } = useTreeFilter()

  const { definitions: siteDefinitions, isReady: isSiteTreeReady } = useXoSiteTreeDefinitions(predicate)

  const uiPluginTrees = getUiPlugins().flatMap(plugin =>
    plugin.tree === undefined ? [] : [plugin.tree.useDefinitions(predicate)]
  )

  const definitions = computed(() => [
    ...siteDefinitions.value,
    ...uiPluginTrees.flatMap(tree => tree.definitions.value),
  ])

  // UI plugin trees are displayed as soon as they are ready, they don't delay the site tree
  const isReady = isSiteTreeReady

  const collapsedIds = useTreeCollapse('site.collapsed', filter, hasFilter)

  const { flatNodes, flatNodeIndexById, expandToNode } = useTree(definitions, { collapsedIds })

  return {
    isReady,
    treeItems: flatNodes,
    treeItemIndexById: flatNodeIndexById,
    filter,
    isSearching,
    expandToNode,
  }
}
