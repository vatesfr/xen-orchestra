import { useXoKubernetesTreeDefinitions } from '@/modules/kubernetes/composables/xo-kubernetes-tree-definitions.composable.ts'
import { useXoSiteTreeDefinitions } from '@/modules/site/composables/xo-site-tree-definitions.composable.ts'
import { useTreeCollapse } from '@core/composables/tree-collapse.composable.ts'
import { useTreeFilter } from '@core/composables/tree-filter.composable.ts'
import { useTree } from '@core/packages/tree/use-tree.ts'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'

export function useNavigationTree() {
  const { filter, predicate, isSearching, hasFilter } = useTreeFilter()

  const { definitions: siteDefinitions, isReady: isSiteTreeReady } = useXoSiteTreeDefinitions(predicate)

  const { definitions: kubernetesDefinitions, isReady: areKubernetesObjectsReady } =
    useXoKubernetesTreeDefinitions(predicate)

  const definitions = computed(() => [...siteDefinitions.value, ...kubernetesDefinitions.value])

  const isReady = logicAnd(isSiteTreeReady, areKubernetesObjectsReady)

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
