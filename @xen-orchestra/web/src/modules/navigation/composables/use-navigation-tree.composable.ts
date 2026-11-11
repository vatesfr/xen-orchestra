import { useXoDockerTreeDefinitions } from '@/modules/docker/composables/xo-docker-tree-definitions.composable.ts'
import { useXoSiteTreeDefinitions } from '@/modules/site/composables/xo-site-tree-definitions.composable.ts'
import type { TreeNodeId } from '@core/packages/tree/types.ts'
import { useTreeCollapse } from '@core/composables/tree-collapse.composable.ts'
import { useTreeFilter } from '@core/composables/tree-filter.composable.ts'
import { useTree } from '@core/packages/tree/use-tree.ts'
import { useLocalStorage } from '@vueuse/core'
import { computed, watch } from 'vue'

export function useNavigationTree() {
  const { filter, predicate, isSearching, hasFilter } = useTreeFilter()

  const collapsedIds = useTreeCollapse('site.collapsed', filter, hasFilter)

  // expanding a host of the containers connects to its engine: they start
  // collapsed, the first time they appear (or else opening XO would connect to
  // every engine), and while searching
  const seenDockerHostIds = useLocalStorage('containers.seen-hosts', new Set<TreeNodeId>())

  const { definitions: siteDefinitions, isReady } = useXoSiteTreeDefinitions(predicate)

  const { definitions: containerDefinitions, hostNodeIds: dockerHostNodeIds } = useXoDockerTreeDefinitions(
    predicate,
    nodeId => !collapsedIds.value.has(nodeId) && (hasFilter.value || seenDockerHostIds.value.has(nodeId))
  )

  function collapseDockerHosts(nodeIds: TreeNodeId[]) {
    nodeIds.forEach(nodeId => collapsedIds.value.add(nodeId))
  }

  function collapseUnseenDockerHosts() {
    const unseen = dockerHostNodeIds.value.filter(nodeId => !seenDockerHostIds.value.has(nodeId))
    collapseDockerHosts(unseen)
    unseen.forEach(nodeId => seenDockerHostIds.value.add(nodeId))
  }

  watch(
    dockerHostNodeIds,
    (nodeIds, previous = []) => {
      if (hasFilter.value) {
        collapseDockerHosts(nodeIds.filter(nodeId => !previous.includes(nodeId)))
      } else {
        collapseUnseenDockerHosts()
      }
    },
    { immediate: true }
  )

  // after `useTreeCollapse()` which resets the collapsed ids of the search
  watch(filter, () => (hasFilter.value ? collapseDockerHosts(dockerHostNodeIds.value) : collapseUnseenDockerHosts()))

  const definitions = computed(() => [...siteDefinitions.value, ...containerDefinitions.value])

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
