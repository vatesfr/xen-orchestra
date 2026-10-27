<template>
  <VtsColumns extra-space-around>
    <VtsColumn>
      <ClusterSystemGeneralInformation :cluster />
    </VtsColumn>
    <VtsColumn>
      <ClusterSystemStatus :cluster />
      <ClusterSystemNetworking :cluster />
    </VtsColumn>
  </VtsColumns>
</template>

<script setup lang="ts">
import ClusterSystemGeneralInformation from '@/modules/kubernetes/components/system/ClusterSystemGeneralInformation.vue'
import ClusterSystemNetworking from '@/modules/kubernetes/components/system/ClusterSystemNetworking.vue'
import ClusterSystemStatus from '@/modules/kubernetes/components/system/ClusterSystemStatus.vue'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'

defineProps<{
  cluster: XoKubernetesCluster
}>()
</script>
