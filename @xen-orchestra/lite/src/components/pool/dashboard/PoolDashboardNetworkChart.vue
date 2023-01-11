<template>
  <!-- TODO: add a loader when data is not fully loaded or undefined -->
  <LinearChart
    :data="data"
    :max-value="customMaxValue"
    :subtitle="$t('last-week')"
    :title="$t('network-throughtput')"
    :value-formatter="customValueFormatter"
  />
</template>

<script lang="ts" setup>
import { computed, inject } from "vue";
import { map } from "lodash-es";
import { useI18n } from "vue-i18n";
import LinearChart from "@/components/charts/LinearChart.vue";
import type { FetchedStats } from "@/composables/fetch-stats.composable";
import { formatSize } from "@/libs/utils";
import type { HostStats } from "@/libs/xapi-stats";
import type { LinearChartData } from "@/types/chart";
import { RRD_STEP_FROM_STRING } from "@/libs/xapi-stats";
import type { XenApiHost } from "@/libs/xen-api";

const { t } = useI18n();

const hostLastWeekStats =
  inject<FetchedStats<XenApiHost, HostStats>>("hostLastWeekStats");

const data = computed<LinearChartData>(() => {
  if (
    hostLastWeekStats?.timestampStart?.value === undefined ||
    hostLastWeekStats.stats?.value === undefined
  ) {
    return [];
  }

  const timestampStart = hostLastWeekStats.timestampStart.value;

  const rxResult = new Map<number, { timestamp: number; value: number }>();
  const txResult = new Map<number, { timestamp: number; value: number }>();

  const addResult = (stats: HostStats, type: string) => {
    const isRxPif = type === "rx";
    const networkStats = Object.values(isRxPif ? stats.pifs.rx : stats.pifs.tx);

    const resultMap = isRxPif ? rxResult : txResult;

    for (let hourIndex = 0; hourIndex < networkStats[0].length; hourIndex++) {
      const timestamp =
        (timestampStart + hourIndex * RRD_STEP_FROM_STRING.hours) * 1000;

      const networkThroughtput = networkStats.reduce(
        (total, throughtput) => total + throughtput[hourIndex],
        0
      );

      resultMap.set(timestamp, {
        timestamp: timestamp,
        value: (resultMap.get(timestamp)?.value ?? 0) + networkThroughtput,
      });
    }
  };

  hostLastWeekStats.stats.value.forEach((host) => {
    if (!host.stats) {
      return;
    }

    addResult(host.stats, "rx");
    addResult(host.stats, "tx");
  });

  return [
    {
      label: t("download"),
      data: Array.from(rxResult.values()),
    },
    {
      label: t("upload"),
      data: Array.from(txResult.values()),
    },
  ];
});

const customMaxValue = computed(
  () =>
    Math.max(
      ...map(data.value[0].data, "value"),
      ...map(data.value[1].data, "value")
    ) * 1.5
);

const customValueFormatter = (value: number) => `${formatSize(value)}`;
</script>
