<template>
  <!-- TODO: add a loader when data is not fully loaded -->
  <LinearChart
    :title="$t('pool-cpu-usage')"
    :subtitle="$t('last-week')"
    :data="data"
    :value-formatter="customValueFormatter"
  />
</template>

<script lang="ts" setup>
import { type ComputedRef, computed, inject } from "vue";
import { useI18n } from "vue-i18n";
import type { LinearChartData } from "@/types/chart";
import LinearChart from "@/components/charts/LinearChart.vue";
import type { Stat } from "@/composables/fetch-stats.composable";
import { getAvgCpuUsage } from "@/libs/utils";
import {
  GRANULARITY,
  RRD_STEP_FROM_STRING,
  type HostStats,
  type VmStats,
} from "@/libs/xapi-stats";

interface LastWeekStats {
  stats?: ComputedRef<Stat<VmStats | HostStats>[]>;
  timestampStart?: ComputedRef<number>;
  timestampEnd?: ComputedRef<number>;
}

const { t } = useI18n();

const hostLastWeekStats = inject<LastWeekStats>("hostLastWeekStats", {});

const vmLastWeekStats = inject<LastWeekStats>("vmLastWeekStats", {});

const timestampStartHostStatsComputed = computed(
  () => hostLastWeekStats.timestampStart?.value
);

const timestampStartWmStatsComputed = computed(
  () => vmLastWeekStats.timestampStart?.value
);

const labelSerie = computed(() => t("stacked-cpu-usage"));

const data = computed<LinearChartData>(() => {
  const result = new Map<string, { date: number; value: number }>();

  const setResult = (
    stats: HostStats | VmStats | undefined,
    timestampStart = 0,
    index = 0
  ) => {
    const avgCpuUsage = getAvgCpuUsage(stats?.cpus);

    if (avgCpuUsage === undefined) {
      return;
    }

    const timestamp =
      (timestampStart + RRD_STEP_FROM_STRING[GRANULARITY.Hours] * index) * 1000;

    const strDate = timestamp.toString();

    result.set(strDate, {
      value:
        (result.get(strDate)?.value ?? 0) + Math.round(avgCpuUsage * 100) / 100,
      date: timestamp,
    });
  };

  vmLastWeekStats.stats?.value.forEach((stat, index) =>
    setResult(stat.stats, timestampStartWmStatsComputed.value, index)
  );

  hostLastWeekStats.stats?.value.forEach((stat, index) =>
    setResult(stat.stats, timestampStartHostStatsComputed.value, index)
  );

  return [
    {
      label: labelSerie.value,
      data: Array.from(result.values()),
    },
  ];
});

const customValueFormatter = (value: number) => `${value}%`;
</script>
