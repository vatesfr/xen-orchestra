<template>
  <div class="pool-dashboard-view">
    <PoolDashboardStatus class="item" />
    <PoolDashboardCpuUsage class="item" />
  </div>
</template>

<script lang="ts" setup>
import PoolDashboardCpuUsage from "@/components/pool/dashboard/PoolDashboardCpuUsage.vue";
import PoolDashboardStatus from "@/components/pool/dashboard/PoolDashboardStatus.vue";
</script>

<style lang="postcss" scoped>
.pool-dashboard-view {
  display: flex;
  gap: 2rem;
}

.item {
  min-width: 37rem;
}
</style>
