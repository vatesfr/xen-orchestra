<template>
  <div>
    <UsageBar :data="data" :n-items="5">
      <template #header>
        <span>Hosts</span>
        <span>Top 5</span>
      </template>
    </UsageBar>
  </div>
</template>
<script lang="ts" setup>
import { forEach, size } from "lodash";
import { computed, watchEffect } from "vue";
import UsageBar from "@/components/UsageBar.vue";
import useFetchStats from "@/composables/fetch-stats.composable";
import { getStatsLength } from "@/libs/utils";
import { GRANULARITY, type HostStats } from "@/libs/xapi-stats";
import { useHostStore } from "@/stores/host.store";

const hostStore = useHostStore();

const hostsWithStats = computed(() =>
  hostStore.allRecords.map((host) => ({
    hostname: host.name_label,
    stats: useFetchStats<HostStats>("host", host.uuid, GRANULARITY.Seconds)
      .stats,
  }))
);
const data = computed(() => {
  const hostsStats: { label: string; value: number }[] = [];

  hostsWithStats.value.forEach((host) => {
    const cpusStats = host.stats.value?.stats.cpus;
    const length = getStatsLength(cpusStats);
    if (length === undefined) {
      return;
    }

    let totalCpusUsage = 0;
    forEach(cpusStats, (cpuStats) => {
      totalCpusUsage = cpuStats.reduce(
        (prev, next) => prev + next,
        totalCpusUsage
      );
    });

    const stackedValue = totalCpusUsage / length;
    const avgUsage = stackedValue / size(cpusStats);
    hostsStats.push({
      label: host.hostname,
      value: avgUsage,
    });
  });
  return hostsStats;
});

watchEffect(() => {
  // console.log(hostStore.allRecords)
  // console.log(hostsData.value);
});
</script>
