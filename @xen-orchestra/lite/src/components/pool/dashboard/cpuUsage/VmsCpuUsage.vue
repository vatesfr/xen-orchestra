<template>
  <UsageBar :data="data" :n-items="5">
    <template #header>
      <span>{{ $t("vms") }}</span>
      <span>{{ $t("top-#", { n: 5 }) }}</span>
    </template>
  </UsageBar>
</template>
<script lang="ts" setup>
import { type ComputedRef, computed, inject } from "vue";
import UsageBar from "@/components/UsageBar.vue";
import { getAvgCpuUsage } from "@/libs/utils";
import type { VmStats } from "@/libs/xapi-stats";

const stats: ComputedRef<
  {
    name: string;
    stats?: VmStats;
  }[]
> = inject<any>("vmStats", []);

const data = computed<{ label: string; value: number }[]>(() => {
  const result: { label: string; value: number }[] = [];

  stats.value.forEach((stat) => {
    if (!stat.stats) {
      return;
    }

    const avgCpuUsage = getAvgCpuUsage(stat.stats.cpus);

    if (avgCpuUsage === undefined) {
      return;
    }

    result.push({
      label: stat.name,
      value: avgCpuUsage,
    });
  });

  return result;
});
</script>
