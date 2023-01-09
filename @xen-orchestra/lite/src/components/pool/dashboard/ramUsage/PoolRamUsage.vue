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
      <UiCardFooter :size="total.totalMemory" :usage="total.totalUsed" />
    </template>
  </LinearChart>
</template>

<script lang="ts" setup>
import LinearChart from "@/components/charts/LinearChart.vue";
import UiCardFooter from "@/components/ui/UiCardFooter.vue";
import type { FetchedStats } from "@/composables/fetch-stats.composable";
import type { HostStats } from "@/libs/xapi-stats";
import { RRD_STEP_FROM_STRING } from "@/libs/xapi-stats";
import { useHostStore } from "@/stores/host.store";
import type { LinearChartData } from "@/types/chart";
import { sumBy } from "lodash-es";
import { storeToRefs } from "pinia";
import { computed, inject } from "vue";
import { useI18n } from "vue-i18n";
import { formatSize, getHostMemory } from "@/libs/utils";
import type { XenApiHost } from "@/libs/xen-api";

const { t } = useI18n();

const hostLastWeekStats =
  inject<FetchedStats<XenApiHost, HostStats>>("hostLastWeekStats");

const total = computed(() => {
  let totalMemory = 0,
    totalFree = 0;

  hostLastWeekStats?.stats?.value.forEach(({ stats }) => {
    if (!stats) {
      return;
    }

    totalMemory += stats.memory.reduce((total, memory) => total + memory, 0);

    totalFree += stats.memoryFree.reduce(
      (totalFree, memoryFree) => totalFree + memoryFree,
      0
    );
  });

  return { totalMemory, totalFree, totalUsed: totalMemory - totalFree };
});

const { allRecords: hosts } = storeToRefs(useHostStore());

const customMaxValue = computed(() =>
  sumBy(hosts.value, (host) => getHostMemory(host)?.size ?? 0)
);

const data = computed<LinearChartData>(() => {
  if (
    hostLastWeekStats?.timestampStart?.value === undefined ||
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
