<template>
  <!-- TODO: add a loader when data is not fully loaded or undefined -->
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
import type { Stat } from "@/composables/fetch-stats.composable";
import type { HostStats, VmStats } from "@/libs/xapi-stats";
import { useHostStore } from "@/stores/host.store";
import type { LinearChartData } from "@/types/chart";
import { computed, type ComputedRef, inject } from "vue";
import { useI18n } from "vue-i18n";

interface LastWeekStats<T extends VmStats | HostStats> {
  stats?: ComputedRef<Stat<T>[]>;
  timestampStart?: ComputedRef<number>;
  timestampEnd?: ComputedRef<number>;
}

const { t } = useI18n();

const hostLastWeekStats = inject<LastWeekStats<HostStats>>(
  "hostLastWeekStats",
  {}
);

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

const data = computed<LinearChartData>(() => {
  const result = new Map<string, { date: number; value: number }>();

  const addResult = (stats: HostStats) => {
    const cpus = Object.values(stats.cpus);
    for (let hourIndex = 0; hourIndex < cpus[0].length; hourIndex++) {
      const timestamp =
        ((timestampStartHostStatsComputed.value ?? 0) + hourIndex * 3600) *
        1000;
      const cpuUsageSum = cpus.reduce(
        (total, cpu) => total + cpu[hourIndex],
        0
      );
      const key = timestamp.toString();

      result.set(key, {
        date: timestamp,
        value: Math.round((result.get(key)?.value ?? 0) + cpuUsageSum),
      });
    }
  };

  hostLastWeekStats.stats?.value.forEach((host) => {
    if (!host.stats) {
      return;
    }

    addResult(host.stats);
  });

  return [
    {
      label: t("stacked-cpu-usage"),
      data: Array.from(result.values()),
    },
  ];
});

const customValueFormatter = (value: number) => `${value}%`;
</script>
