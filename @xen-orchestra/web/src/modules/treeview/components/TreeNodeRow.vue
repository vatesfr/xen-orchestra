<template>
  <SiteTreeItem v-if="node.discriminator === 'site'" :branch="node as SiteBranch" />
  <PoolTreeItem v-else-if="node.discriminator === 'pool'" :branch="node as PoolBranch" />
  <HostTreeItem v-else-if="node.discriminator === 'host'" :branch="node as HostBranch" />
  <VmTreeItem v-else-if="node.discriminator === 'vm'" :leaf="node as VmLeaf" />
  <component :is="uiPluginTreeItemComponent" v-else-if="uiPluginTreeItemComponent" :node />
</template>

<script lang="ts" setup>
import HostTreeItem from '@/modules/treeview/components/HostTreeItem.vue'
import PoolTreeItem from '@/modules/treeview/components/PoolTreeItem.vue'
import SiteTreeItem from '@/modules/treeview/components/SiteTreeItem.vue'
import VmTreeItem from '@/modules/treeview/components/VmTreeItem.vue'
import type { HostBranch, PoolBranch, SiteBranch, VmLeaf } from '@/modules/treeview/types/tree.type.ts'
import { getUiPluginTreeItemComponent } from '@/modules/ui-plugin/ui-plugin.registry.ts'
import type { TreeNode } from '@core/packages/tree/types.ts'
import { IK_TREE_LIST_DEPTH } from '@core/utils/injection-keys.util.ts'
import { computed, provide } from 'vue'

const { node, depth } = defineProps<{
  node: TreeNode
  depth: number
}>()

const uiPluginTreeItemComponent = computed(() => getUiPluginTreeItemComponent(node.discriminator))

provide(
  IK_TREE_LIST_DEPTH,
  computed(() => depth + 1)
)
</script>
