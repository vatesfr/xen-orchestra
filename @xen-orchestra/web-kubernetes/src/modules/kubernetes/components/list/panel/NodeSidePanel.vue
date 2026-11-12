<template>
  <VtsSidePanel :has-selection="!!node" @close="emit('close')">
    <template v-if="node" #more-actions>
      <NodeActions :node />
    </template>
    <template v-if="node">
      <NodeInfoCard :node />
      <NodeNetworkingCard :node />
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import NodeActions from '@/modules/kubernetes/components/actions/node/NodeActions.vue'
import NodeInfoCard from '@/modules/kubernetes/components/list/panel/card/node/NodeInfoCard.vue'
import NodeNetworkingCard from '@/modules/kubernetes/components/list/panel/card/node/NodeNetworkingCard.vue'
import type { XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'

defineProps<{
  node?: XoKubernetesNode
}>()

const emit = defineEmits<{
  close: []
}>()
</script>
