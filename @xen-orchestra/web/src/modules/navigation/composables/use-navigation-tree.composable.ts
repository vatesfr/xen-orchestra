import { useXoKubernetesTreeDefinitions } from '@/modules/kubernetes/composables/xo-kubernetes-tree-definitions.composable.ts'
import { useXoSiteTreeDefinitions } from '@/modules/site/composables/xo-site-tree-definitions.composable.ts'
import type { TreeNodeId } from '@core/packages/tree/types.ts'
import { useTreeFilter } from '@core/composables/tree-filter.composable.ts'
import { useTree } from '@core/packages/tree/use-tree.ts'
import { useLocalStorage } from '@vueuse/core'
import { logicAnd } from '@vueuse/math'
import { computed, reactive, ref, watch } from 'vue'

export function useNavigationTree() {
  const { filter, predicate, isSearching, hasFilter } = useTreeFilter()

  const { definitions: siteDefinitions, isReady: isSiteTreeReady } = useXoSiteTreeDefinitions(predicate)

  const { definitions: kubernetesDefinitions, isReady: areKubernetesObjectsReady } =
    useXoKubernetesTreeDefinitions(predicate)

  const definitions = computed(() => [...siteDefinitions.value, ...kubernetesDefinitions.value])

  const isReady = logicAnd(isSiteTreeReady, areKubernetesObjectsReady)

  const collapseState = reactive({
    default: useLocalStorage('site.collapsed', new Set<TreeNodeId>()),
    filtered: ref(new Set<TreeNodeId>()),
  })

  watch(filter, () => collapseState.filtered.clear())

  const collapsedIds = computed({
    get: () => (hasFilter.value ? collapseState.filtered : collapseState.default),
    set: value => {
      if (hasFilter.value) {
        collapseState.filtered = value
      } else {
        collapseState.default = value
      }
    },
  })

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
