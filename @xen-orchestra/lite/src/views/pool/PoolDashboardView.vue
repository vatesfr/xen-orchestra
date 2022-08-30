<template>
  <div class="pool-dashboard-view card-view">
    <PoolDashboardStatus class="item" />
  </div>
</template>

<script lang="ts" setup>
import PoolDashboardStatus from "@/components/pool/dashboard/PoolDashboardStatus.vue";
</script>

<style lang="postcss" scoped>
.item {
  min-width: 37rem;
}
</style>
