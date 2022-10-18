<template>
  <UsageBar :data="statFetched ? data : undefined" :n-items="5">
    <template #header>
      <span>{{ $t("vms") }}</span>
      <span>{{ $t("top-#", { n: 5 }) }}</span>
    </template>
  </UsageBar>
</template>

<script lang="ts" setup>
import { type ComputedRef, computed, inject } from "vue";
import UsageBar from "@/components/UsageBar.vue";
import type { Stat } from "@/composables/fetch-stats.composable";
import { getAvgCpuUsage } from "@/libs/utils";
import type { VmStats } from "@/libs/xapi-stats";

const stats = inject<ComputedRef<Stat<VmStats>[]>>(
  "vmStats",
  computed(() => [])
);

const data = computed<{ id: string; label: string; value: number }[]>(() => {
  const result: { id: string; label: string; value: number }[] = [];

  stats.value.forEach((stat) => {
    if (!stat.stats) {
      return;
    }

    const avgCpuUsage = getAvgCpuUsage(stat.stats.cpus);

    if (avgCpuUsage === undefined) {
      return;
    }

    result.push({
      id: stat.id,
      label: stat.name,
      value: avgCpuUsage,
    });
  });

  return result;
});

const statFetched: ComputedRef<boolean> = computed(() =>
  statFetched.value
    ? true
    : stats.value.length > 0 && stats.value.length === data.value.length
);
</script>
