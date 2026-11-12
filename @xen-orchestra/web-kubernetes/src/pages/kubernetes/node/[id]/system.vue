<template>
  <VtsColumns extra-space-around>
    <VtsColumn>
      <NodeSystemGeneralInformation :node />
      <NodeSystemStatus :node />
    </VtsColumn>
    <VtsColumn>
      <NodeSystemNetwork :node />
    </VtsColumn>
  </VtsColumns>
</template>

<script setup lang="ts">
import NodeSystemGeneralInformation from '@/modules/kubernetes/components/system/NodeSystemGeneralInformation.vue'
import NodeSystemNetwork from '@/modules/kubernetes/components/system/NodeSystemNetwork.vue'
import NodeSystemStatus from '@/modules/kubernetes/components/system/NodeSystemStatus.vue'
import type { XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'

defineProps<{
  node: XoKubernetesNode
}>()
</script>
