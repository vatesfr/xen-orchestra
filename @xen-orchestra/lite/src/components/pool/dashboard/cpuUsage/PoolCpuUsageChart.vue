<template>
  <!-- TODO: add a loader when data is not fully loaded or undefined -->
  <!-- TODO: add small loader with tooltips when stats can be expired -->
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
import { useHostCollection } from "@/stores/xen-api/host.store";
import type { HostStats } from "@/libs/xapi-stats";
import { RRD_STEP_FROM_STRING } from "@/libs/xapi-stats";
import type { LinearChartData, ValueFormatter } from "@/types/chart";
import { IK_HOST_LAST_WEEK_STATS } from "@/types/injection-keys";
import { sumBy } from "lodash-es";
import { computed, defineAsyncComponent, inject } from "vue";
import { useI18n } from "vue-i18n";

const LinearChart = defineAsyncComponent(
  () => import("@/components/charts/LinearChart.vue")
);

const { t } = useI18n();

const hostLastWeekStats = inject(IK_HOST_LAST_WEEK_STATS);

const { records: hosts } = useHostCollection();

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

const customValueFormatter: ValueFormatter = (value) => `${value}%`;
</script>
