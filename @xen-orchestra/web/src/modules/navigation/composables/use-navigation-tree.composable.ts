import { useXoSiteTreeDefinitions } from '@/modules/site/composables/xo-site-tree-definitions.composable.ts'
import { useTreeCollapse } from '@core/composables/tree-collapse.composable.ts'
import { useTreeFilter } from '@core/composables/tree-filter.composable.ts'
import { useTree } from '@core/packages/tree/use-tree.ts'

export function useNavigationTree() {
  const { filter, predicate, isSearching, hasFilter } = useTreeFilter()

  const { definitions, isReady } = useXoSiteTreeDefinitions(predicate)

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
