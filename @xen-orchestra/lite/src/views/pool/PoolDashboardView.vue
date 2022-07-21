<template>
  <div class="pool-dashboard-view">
    <PoolDashboardStatus class="item" />
    <UiCard style="min-width: 40rem">
      <UiTitle type="h4">RAM usage</UiTitle>
      <UsageBar title="Hosts" :data="data.slice(0, 5)">
        <template #header>
          <span>Host</span>
          <span>Top 5</span>
        </template>
      </UsageBar>
    </UiCard>
  </div>
</template>

<script lang="ts" setup>
import UsageBar from "@/components/UsageBar.vue";
import PoolDashboardStatus from "@/components/pool/dashboard/PoolDashboardStatus.vue";
import UiCard from "@/components/ui/UiCard.vue";
import UiTitle from "@/components/ui/UiTitle.vue";

const data = [
  {
    value: 61,
    maxValue: 128,
    label: "R620-L2",
    badgeLabel: "61/128 GB",
  },
  {
    value: 38,
    maxValue: 64,
    label: "R620-L1",
    badgeLabel: "38/64 GB",
  },
  {
    value: 118,
    maxValue: 512,
    label: "R620-L3",
    badgeLabel: "118/512 GB",
  },
  {
    value: 60,
    maxValue: 1000,
    label: "R620-L5",
    badgeLabel: "60/1000 GB",
  },
  {
    value: 4,
    maxValue: 32,
    label: "R620-L4",
    badgeLabel: "4/32 GB",
  },
  {
    value: 60,
    maxValue: 1000,
    label: "R620-L5",
    badgeLabel: "60/1000 GB",
  },
  {
    value: 4,
    maxValue: 32,
    label: "R620-L4",
    badgeLabel: "4/32 GB",
  },
  {
    value: 60,
    maxValue: 1000,
    label: "R620-L5",
    badgeLabel: "60/1000 GB",
  },
  {
    value: 4,
    maxValue: 32,
    label: "R620-L4",
    badgeLabel: "4/32 GB",
  },
  {
    value: 60,
    maxValue: 1000,
    label: "R620-L5",
    badgeLabel: "60/1000 GB",
  },
  {
    value: 4,
    maxValue: 32,
    label: "R620-L4",
    badgeLabel: "4/32 GB",
  },
];
</script>

<style lang="postcss" scoped>
.pool-dashboard-view {
  display: flex;
  padding: 2rem;
  gap: 2rem;
}

.item {
  min-width: 37rem;
}
</style>
