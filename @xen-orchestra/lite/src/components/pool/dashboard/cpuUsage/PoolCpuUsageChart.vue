<template>
  <!-- TODO: add a loader when data is not fully loaded or undefined -->
  <!-- TODO: Display the NoDataError component in case of a data recovery error -->
  <LinearChart
    :data="data"
    :max-value="customMaxValue"
    :subtitle="$t('last-week')"
    :title="$t('pool-cpu-usage')"
    :value-formatter="customValueFormatter"
  />
</template>

<script lang="ts" setup>
import LinearChart from "@/components/charts/LinearChart.vue";
import type { HostStats } from "@/libs/xapi-stats";
import type { FetchedStats } from "@/composables/fetch-stats.composable";
import { RRD_STEP_FROM_STRING } from "@/libs/xapi-stats";
import type { XenApiHost } from "@/libs/xen-api";
import { useHostStore } from "@/stores/host.store";
import type { LinearChartData } from "@/types/chart";
import { sumBy } from "lodash-es";
import { storeToRefs } from "pinia";
import { computed, inject } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const hostLastWeekStats =
  inject<FetchedStats<XenApiHost, HostStats>>("hostLastWeekStats");

const { allRecords: hosts } = storeToRefs(useHostStore());

const customMaxValue = computed(
  () => 100 * sumBy(hosts.value, (host) => +host.cpu_info.cpu_count)
);

const data = computed<LinearChartData>(() => {
  const timestampStart = hostLastWeekStats?.timestampStart?.value;
  const stats = hostLastWeekStats?.stats?.value;

  if (timestampStart === undefined || stats == null) {
    return [];
  }

  const result = new Map<number, { timestamp: number; value: number }>();

  const addResult = (stats: HostStats) => {
    const cpus = Object.values(stats.cpus);

    for (let hourIndex = 0; hourIndex < cpus[0].length; hourIndex++) {
      const timestamp =
        (timestampStart + hourIndex * RRD_STEP_FROM_STRING.hours) * 1000;

      const cpuUsageSum = cpus.reduce(
        (total, cpu) => total + cpu[hourIndex],
        0
      );

      result.set(timestamp, {
        timestamp: timestamp,
        value: Math.round((result.get(timestamp)?.value ?? 0) + cpuUsageSum),
      });
    }
  };

  stats.forEach((host) => {
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
