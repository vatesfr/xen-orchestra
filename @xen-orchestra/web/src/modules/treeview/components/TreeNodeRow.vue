<template>
  <SiteTreeItem v-if="node.discriminator === 'site'" :branch="node as SiteBranch" />
  <PoolTreeItem v-else-if="node.discriminator === 'pool'" :branch="node as PoolBranch" />
  <HostTreeItem v-else-if="node.discriminator === 'host'" :branch="node as HostBranch" />
  <VmTreeItem v-else :leaf="node as VmLeaf" />
</template>

<script lang="ts" setup>
import HostTreeItem from '@/modules/treeview/components/HostTreeItem.vue'
import PoolTreeItem from '@/modules/treeview/components/PoolTreeItem.vue'
import SiteTreeItem from '@/modules/treeview/components/SiteTreeItem.vue'
import VmTreeItem from '@/modules/treeview/components/VmTreeItem.vue'
import type { HostBranch, PoolBranch, SiteBranch, VmLeaf } from '@/modules/treeview/types/tree.type.ts'
import type { TreeNode } from '@core/packages/tree/types'
import { IK_TREE_LIST_DEPTH } from '@core/utils/injection-keys.util.ts'
import { computed, provide } from 'vue'

const { node, depth } = defineProps<{
  node: TreeNode
  depth: number
}>()

provide(
  IK_TREE_LIST_DEPTH,
  computed(() => depth + 1)
)
</script>
