<template>
  <div class="dashboard">
    <ClusterDashboardQuickInfo class="quick-info" :cluster />
  </div>
</template>

<script setup lang="ts">
import ClusterDashboardQuickInfo from '@/modules/kubernetes/components/dashboard/ClusterDashboardQuickInfo.vue'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'

defineProps<{
  cluster: XoKubernetesCluster
}>()
</script>

<style lang="postcss" scoped>
.dashboard {
  margin: 0.8rem;

  .quick-info {
    width: 100%;
  }
}
</style>
