<template>
  <div class="pool-dashboard-view">
    <PoolDashboardStatus class="item" />
    <PoolDashboardStorageUsage class="item" />
  </div>
</template>

<script lang="ts" setup>
import PoolDashboardStatus from "@/components/pool/dashboard/PoolDashboardStatus.vue";
import PoolDashboardStorageUsage from "@/components/pool/dashboard/PoolDashboardStorageUsage.vue";
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
