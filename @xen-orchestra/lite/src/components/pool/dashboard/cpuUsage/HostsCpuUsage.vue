<template>
  <UsageBar :data="data" :n-items="5">
    <template #header>
      <span>Hosts</span>
      <span>Top 5</span>
    </template>
  </UsageBar>
</template>

<script lang="ts" setup>
import { differenceBy } from "lodash";
import { computed, onMounted, watch } from "vue";
import UsageBar from "@/components/UsageBar.vue";
import useFetchStats from "@/composables/fetch-stats.composable";
import { getAvgCpuUsage } from "@/libs/utils";
import { GRANULARITY, type HostStats } from "@/libs/xapi-stats";
import type { XenApiHost } from "@/libs/xen-api";
import { useHostStore } from "@/stores/host.store";

const { register, unregister, stats } = useFetchStats<XenApiHost, HostStats>(
  "host",
  GRANULARITY.Seconds
);

const hostStore = useHostStore();

const data = computed<{ label: string; value: number }[]>(() => {
  const result: { label: string; value: number }[] = [];

  stats.value.forEach((stat) => {
    if (stat.stats === undefined) {
      return;
    }

    const avgCpuUsage = getAvgCpuUsage(stat.stats.cpus);

    if (avgCpuUsage === undefined) {
      return;
    }

    result.push({
      label: stat.name,
      value: avgCpuUsage,
    });
  });
  return result;
});

watch(
  () => hostStore.allRecords,
  (hosts, previousHosts) => {
    // Host turned On
    differenceBy(hosts, previousHosts ?? [], "uuid").forEach(register);

    // Host turned Off
    differenceBy(previousHosts, hosts, "uuid").forEach(unregister);
  }
);

onMounted(() => {
  hostStore.allRecords.forEach(register);
});
</script>
