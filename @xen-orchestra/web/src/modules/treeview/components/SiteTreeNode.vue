<template>
  <div class="vts-tree-item" :data-node-id="node.data.id" @click="handleClick()">
    <SiteTreeItem v-if="node.treeId === 'sites'" :branch="node as SiteBranch" />
    <PoolTreeItem v-else-if="node.treeId === 'pools'" :branch="node as PoolBranch" />
    <HostTreeItem v-else-if="node.treeId === 'hosts'" :branch="node as HostBranch" />
    <VmTreeItem v-else-if="node.treeId === 'vms'" :leaf="node as VmLeaf" />
  </div>
</template>

<script lang="ts" setup>
import HostTreeItem from '@/modules/treeview/components/HostTreeItem.vue'
import PoolTreeItem from '@/modules/treeview/components/PoolTreeItem.vue'
import SiteTreeItem from '@/modules/treeview/components/SiteTreeItem.vue'
import VmTreeItem from '@/modules/treeview/components/VmTreeItem.vue'
import type { HostBranch, PoolBranch, SiteBranch, VmLeaf } from '@/modules/treeview/types/tree.type.ts'
import type { TreeNode } from '@core/packages/tree/types.ts'
import { useSidebarStore } from '@core/stores/sidebar.store'
import { useUiStore } from '@core/stores/ui.store'
import {
  IK_TREE_ITEM_EXPANDED,
  IK_TREE_ITEM_HAS_CHILDREN,
  IK_TREE_LIST_DEPTH,
} from '@core/utils/injection-keys.util.ts'
import { computed, provide, ref } from 'vue'

const { node } = defineProps<{
  node: TreeNode
}>()

const sidebar = useSidebarStore()
const uiStore = useUiStore()

// The flat list renders each node on its own, so the indentation, toggle and expanded state
// that were previously derived from nested `VtsTreeList`/`VtsTreeItem` are provided here from
// the node itself. This component is keyed by `node.id`, so these values stay correct as the
// virtual scroller recycles rows.
provide(IK_TREE_LIST_DEPTH, ref(node.depth + 1))
provide(
  IK_TREE_ITEM_HAS_CHILDREN,
  computed(() => node.isBranch && node.hasChildren)
)
provide(
  IK_TREE_ITEM_EXPANDED,
  computed(() => (node.isBranch ? !node.isCollapsed : true))
)

function handleClick() {
  if (uiStore.isSmall) {
    sidebar.toggleExpand(false)
  }
}
</script>
