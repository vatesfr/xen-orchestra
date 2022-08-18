<template>
  <div v-if="data.length !== 0">
    <UsageBar :data="data" :n-items="5">
      <template #header>
        <span>Hosts</span>
        <span>Top 5</span>
      </template>
    </UsageBar>
  </div>
</template>
<script lang="ts" setup>
import { computed, onMounted, onUnmounted } from "vue";
import UsageBar from "@/components/UsageBar.vue";
import useFetchStats from "@/composables/fetch-stats.composable";
import { getAvgCpuUsage } from "@/libs/utils";
import { GRANULARITY, type HostStats } from "@/libs/xapi-stats";
import { useHostStore } from "@/stores/host.store";

const hostStore = useHostStore();

const hostsWithStats = computed(() =>
  hostStore.allRecords.map((host) => {
    const fetchStats = useFetchStats<HostStats>(
      "host",
      host.uuid,
      GRANULARITY.Seconds
    );
    return {
      hostname: host.name_label,
      stats: fetchStats.stats,
      pausable: fetchStats.pausable,
    };
  })
);

const pausableStats = computed(() =>
  hostsWithStats.value.map((host) => host.pausable)
);

const data = computed(() => {
  const hostsStats: { label: string; value: number }[] = [];

  for (const key in hostsWithStats.value) {
    const host = hostsWithStats.value[key];

    const avgCpuUsage = getAvgCpuUsage(host.stats.value?.stats.cpus);
    if (avgCpuUsage === undefined) {
      continue;
    }

    hostsStats.push({
      label: host.hostname,
      value: avgCpuUsage,
    });
  }
  return hostsStats;
});

onMounted(() => {
  pausableStats.value.forEach((p) => p.resume());
});
onUnmounted(() => {
  pausableStats.value.forEach((p) => p.pause());
});
</script>
