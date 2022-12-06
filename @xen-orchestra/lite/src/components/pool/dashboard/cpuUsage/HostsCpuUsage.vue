<template>
  <UsageBar :data="statFetched ? data : undefined" :n-items="N_ITEMS">
    <template #header>
      <span>{{ $t("hosts") }}</span>
      <span>{{ $t("top-#", { n: N_ITEMS }) }}</span>
    </template>
  </UsageBar>
</template>

<script lang="ts" setup>
import { type ComputedRef, computed, inject } from "vue";
import UsageBar from "@/components/UsageBar.vue";
import type { Stat } from "@/composables/fetch-stats.composable";
import { getAvgCpuUsage } from "@/libs/utils";
import type { HostStats } from "@/libs/xapi-stats";
import { N_ITEMS } from "@/views/pool/PoolDashboardView.vue";

const stats = inject<ComputedRef<Stat<HostStats>[]>>(
  "hostStats",
  computed(() => [])
);

const data = computed<{ id: string; label: string; value: number }[]>(() => {
  const result: { id: string; label: string; value: number }[] = [];

  stats.value.forEach((stat) => {
    if (stat.stats === undefined) {
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
