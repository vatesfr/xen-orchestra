<template>
  <SiteTreeItem v-if="node.discriminator === 'site'" :branch="node as SiteBranch" />
  <PoolTreeItem v-else-if="node.discriminator === 'pool'" :branch="node as PoolBranch" />
  <HostTreeItem v-else-if="node.discriminator === 'host'" :branch="node as HostBranch" />
  <VmTreeItem v-else-if="node.discriminator === 'vm'" :leaf="node as VmLeaf" />
  <KubernetesTreeItem v-else-if="node.discriminator === 'kubernetes'" :branch="node as KubernetesBranch" />
  <KubernetesClusterTreeItem
    v-else-if="node.discriminator === 'kubernetes-cluster'"
    :branch="node as KubernetesClusterBranch"
  />
  <KubernetesNodeTreeItem v-else-if="node.discriminator === 'kubernetes-node'" :leaf="node as KubernetesNodeLeaf" />
  <KubernetesNamespaceTreeItem
    v-else-if="node.discriminator === 'kubernetes-namespace'"
    :branch="node as KubernetesNamespaceBranch"
  />
  <KubernetesPodTreeItem v-else-if="node.discriminator === 'kubernetes-pod'" :leaf="node as KubernetesPodLeaf" />
</template>

<script lang="ts" setup>
import HostTreeItem from '@/modules/treeview/components/HostTreeItem.vue'
import KubernetesClusterTreeItem from '@/modules/treeview/components/KubernetesClusterTreeItem.vue'
import KubernetesNamespaceTreeItem from '@/modules/treeview/components/KubernetesNamespaceTreeItem.vue'
import KubernetesNodeTreeItem from '@/modules/treeview/components/KubernetesNodeTreeItem.vue'
import KubernetesPodTreeItem from '@/modules/treeview/components/KubernetesPodTreeItem.vue'
import KubernetesTreeItem from '@/modules/treeview/components/KubernetesTreeItem.vue'
import PoolTreeItem from '@/modules/treeview/components/PoolTreeItem.vue'
import SiteTreeItem from '@/modules/treeview/components/SiteTreeItem.vue'
import VmTreeItem from '@/modules/treeview/components/VmTreeItem.vue'
import type {
  HostBranch,
  KubernetesBranch,
  KubernetesClusterBranch,
  KubernetesNamespaceBranch,
  KubernetesNodeLeaf,
  KubernetesPodLeaf,
  PoolBranch,
  SiteBranch,
  VmLeaf,
} from '@/modules/treeview/types/tree.type.ts'
import type { TreeNode } from '@core/packages/tree/types.ts'
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
