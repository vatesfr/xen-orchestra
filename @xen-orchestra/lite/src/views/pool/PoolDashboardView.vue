<template>
  <div class="pool-dashboard-view">
    <PoolDashboardStatus class="item" />

    <UiCard style="min-width: 40rem">
      <UiTitle type="h4">Storage usage</UiTitle>
      <ProgressBar :value="65" style="margin: 1rem 0" />
      <ProgressBar :value="50" style="margin: 1rem 0" />
      <ProgressBar :value="40" style="margin: 1rem 0" />
      <ProgressBar :value="22" style="margin: 1rem 0" />
    </UiCard>

    <UiCard>
      <UiBadge>38/64 GB</UiBadge>
    </UiCard>
  </div>
</template>

<script lang="ts" setup>
import ProgressBar from "@/components/ProgressBar.vue";
import PoolDashboardStatus from "@/components/pool/dashboard/PoolDashboardStatus.vue";
import UiBadge from "@/components/ui/UiBadge.vue";
import UiCard from "@/components/ui/UiCard.vue";
import UiTitle from "@/components/ui/UiTitle.vue";
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
