<template>
  <UsageBar :data="data" :n-items="5">
    <template #header>
      <span>VMs</span>
      <span>Top 5</span>
    </template>
  </UsageBar>
</template>

<script lang="ts" setup>
import { type ComputedRef, computed, inject } from "vue";
import UsageBar from "@/components/UsageBar.vue";
import { formatSize, parseRamUsage } from "@/libs/utils";
import type { VmStats } from "@/libs/xapi-stats";

const stats = inject<
  ComputedRef<
    {
      name: string;
      stats?: VmStats;
    }[]
  >
>(
  "vmStats",
  computed(() => [])
);

const data = computed<{ label: string; value: number }[]>(() => {
  const result: { label: string; value: number; badgeLabel: string }[] = [];

  stats.value.forEach((stat) => {
    if (stat.stats === undefined) {
      return;
    }

    const { percentUsed, max, used } = parseRamUsage(stat.stats);
    if (percentUsed === undefined || used === undefined) {
      return;
    }

    result.push({
      label: stat.name,
      value: percentUsed,
      badgeLabel: `${formatSize(used)}/${formatSize(max)}`,
    });
  });
  return result;
});
</script>
