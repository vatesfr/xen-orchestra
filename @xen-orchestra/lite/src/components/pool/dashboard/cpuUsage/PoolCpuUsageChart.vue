<template>
  <!-- TODO: add a loader when data is not fully loaded -->
  <LinearChart
    :title="$t('pool-cpu-usage')"
    :subtitle="$t('last-week')"
    :data="data"
    :value-formatter="customValueFormatter"
    :max-value="customMaxValue"
  />
</template>

<script lang="ts" setup>
import LinearChart from "@/components/charts/LinearChart.vue";
import { type ComputedRef, computed, inject } from "vue";
import { getAvgCpuUsage } from "@/libs/utils";
import type { LinearChartData } from "@/types/chart";
import {
  type HostStats,
  GRANULARITY,
  RRD_STEP_FROM_STRING,
  type VmStats,
} from "@/libs/xapi-stats";
import type { Stat } from "@/composables/fetch-stats.composable";
import { useHostStore } from "@/stores/host.store";
import { useI18n } from "vue-i18n";

interface LastWeekStats {
  stats?: ComputedRef<Stat<VmStats | HostStats>[]>;
  timestampStart?: ComputedRef<number>;
  timestampEnd?: ComputedRef<number>;
}

const { t } = useI18n();

const hostLastWeekStats = inject<LastWeekStats>("hostLastWeekStats", {});

const vmLastWeekStats = inject<LastWeekStats>("vmLastWeekStats", {});

const hostStore = useHostStore();

const customMaxValue = computed(() => {
  let nCpus = 0;
  hostStore.allRecords.forEach((host) => {
    nCpus += +host.cpu_info.cpu_count;
  });
  return nCpus * 100;
});

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
