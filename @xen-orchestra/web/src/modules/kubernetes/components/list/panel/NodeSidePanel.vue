<template>
  <VtsSidePanel :has-selection="!!node" @close="emit('close')">
    <template v-if="node">
      <NodeInfoCard :node />
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import NodeInfoCard from '@/modules/kubernetes/components/list/panel/card/NodeInfoCard.vue'
import type { XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'

defineProps<{
  node?: XoKubernetesNode
}>()

const emit = defineEmits<{
  close: []
}>()
</script>
