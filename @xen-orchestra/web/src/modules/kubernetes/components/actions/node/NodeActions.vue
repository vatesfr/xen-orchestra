<template>
  <NodeCordonButton :node />
  <NodeUncordonButton :node />
  <NodeDrainButton :node />
</template>

<script lang="ts" setup>
import NodeCordonButton from '@/modules/kubernetes/components/actions/node/NodeCordonButton.vue'
import NodeDrainButton from '@/modules/kubernetes/components/actions/node/NodeDrainButton.vue'
import NodeUncordonButton from '@/modules/kubernetes/components/actions/node/NodeUncordonButton.vue'
import type { XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'

defineProps<{
  node: XoKubernetesNode
}>()
</script>
