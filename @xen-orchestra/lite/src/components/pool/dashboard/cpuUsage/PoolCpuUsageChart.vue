<template>
  <!-- TOFIX: use I18n -->
  <LinearChart
    title="Pool CPU Usage"
    subtitle="Last week"
    :data="dataA"
    :value-formatter="customValueFormatter"
  />
</template>

<script lang="ts" setup>
import { type ComputedRef, computed, inject } from "vue";
import type { LinearChartData } from "@/types/chart";
import LinearChart from "@/components/charts/LinearChart.vue";
import type { Stat } from "@/composables/fetch-stats.composable";
import { getAvgCpuUsage } from "@/libs/utils";
import {
  GRANULARITY,
  type HostStats,
  RRD_STEP_FROM_STRING,
  type VmStats,
} from "@/libs/xapi-stats";

const hostLastWeekStats = inject<ComputedRef>(
  "hostLastWeekStats",
  computed(() => [])
);

const vmLastWeekStats = inject<ComputedRef>(
  "vmLastWeekStats",
  computed(() => [])
);

const timestampStartWmStatsComputed = computed(
  () => vmLastWeekStats.timestampStart.value
);

const data = computed<{ date: number; value: number }[]>(() => {
  const result = new Map<string, { date: number; value: number }>();

  vmLastWeekStats.stats.value
    .concat(hostLastWeekStats.stats.value)
    .forEach((stat: { stats: HostStats | VmStats }, index: any) => {
      if (stat.stats === undefined) {
        return;
      }

      const avgCpuUsage = getAvgCpuUsage(stat.stats.cpus);

      if (avgCpuUsage === undefined) {
        return;
      }

      const date =
        (timestampStartWmStatsComputed.value +
          RRD_STEP_FROM_STRING[GRANULARITY.Hours] * index) *
        1000;

      const strDate = date.toString();

      result.set(strDate, {
        value:
          (result.get(strDate)?.value ?? 0) +
          Math.round(avgCpuUsage * 100) / 100,
        date,
      });
    });

  return Array.from(result.values());
});

const dataA = computed<LinearChartData>(() => [
  {
    label: "Stacked CPU usage",
    data: data.value,
  },
]);

const customValueFormatter = (value: number) => {
  return `${value}%`;
};
</script>
