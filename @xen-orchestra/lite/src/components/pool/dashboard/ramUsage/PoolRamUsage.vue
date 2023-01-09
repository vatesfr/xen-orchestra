<template>
  <!-- TODO: add a loader when data is not fully loaded or undefined -->
  <LinearChart
    :data="data"
    :max-value="customMaxValue"
    :subtitle="$t('last-week')"
    :title="$t('pool-ram-usage')"
    :value-formatter="customValueFormatter"
  >
    <template #summary>
      <UiCardFooter :percent-free="0" :percent-used="0" :size="0" :usage="0" />
    </template>
  </LinearChart>
</template>

<script lang="ts" setup>
import LinearChart from "@/components/charts/LinearChart.vue";
import UiCardFooter from "@/components/ui/UiCardFooter.vue";
import type { Stat } from "@/composables/fetch-stats.composable";
import type { HostStats, VmStats } from "@/libs/xapi-stats";
import { RRD_STEP_FROM_STRING } from "@/libs/xapi-stats";
import { useHostStore } from "@/stores/host.store";
import type { LinearChartData } from "@/types/chart";
import { sumBy } from "lodash-es";
import { storeToRefs } from "pinia";
import { computed, type ComputedRef, inject } from "vue";
import { useI18n } from "vue-i18n";
import { formatSize, getHostMemory } from "@/libs/utils";

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

const totalUsed = computed(() => {
  hostLastWeekStats.stats?.value.forEach(({ stats }) => {
    if (!stats) {
      return;
    }

    const memoryFree = stats.memoryFree;
    return stats.memory.map((memory, index) => memory - memoryFree[index]);
  });
  return 0;
});

const { allRecords: hosts } = storeToRefs(useHostStore());

const customMaxValue = computed(() =>
  sumBy(hosts.value, (host) => getHostMemory(host)?.size ?? 0)
);

const data = computed<LinearChartData>(() => {
  if (
    hostLastWeekStats.timestampStart?.value === undefined ||
    hostLastWeekStats.stats?.value === undefined
  ) {
    return [];
  }

  const timestampStart = hostLastWeekStats.timestampStart.value;

  const result = new Map<number, { timestamp: number; value: number }>();

  const addResult = (stats: HostStats) => {
    const memoryFree = stats.memoryFree;
    const memoryUsage = stats.memory.map(
      (memory, index) => memory - memoryFree[index]
    );

    for (let hourIndex = 0; hourIndex < memoryUsage.length; hourIndex++) {
      const timestamp =
        (timestampStart + hourIndex * RRD_STEP_FROM_STRING.hours) * 1000;

      result.set(timestamp, {
        timestamp: timestamp,
        value: (result.get(timestamp)?.value ?? 0) + memoryUsage[hourIndex],
      });
    }
  };

  hostLastWeekStats.stats.value.forEach((host) => {
    if (!host.stats) {
      return;
    }

    addResult(host.stats);
  });

  return [
    {
      label: t("stacked-ram-usage"),
      data: Array.from(result.values()),
    },
  ];
});

const customValueFormatter = (value: number) => `${formatSize(value)}`;
</script>
