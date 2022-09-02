<template>
  <UsageBar :data="data" :n-items="5">
    <template #header>
      <span>VMs</span>
      <span>Top 5</span>
    </template>
  </UsageBar>
</template>
<script lang="ts" setup>
import { computed, onMounted, onUnmounted } from "vue";
import UsageBar from "@/components/UsageBar.vue";
import useFetchStats from "@/composables/fetch-stats.composable";
import { deepComputed, getAvgCpuUsage } from "@/libs/utils";
import { GRANULARITY, type VmStats } from "@/libs/xapi-stats";
import { useVmStore } from "@/stores/vm.store";

const vmStore = useVmStore();

const runningVms = deepComputed(() =>
  vmStore.allRecords
    .filter((vm) => vm.power_state === "Running")
    .map((vm) => ({ uuid: vm.uuid, nameLabel: vm.name_label }))
);

const vmsWithStats = computed(() =>
  runningVms.value?.map((vm) => {
    const fetchStats = useFetchStats<VmStats>(
      "vm",
      vm.uuid,
      GRANULARITY.Seconds
    );
    return {
      vmName: vm.nameLabel,
      stats: fetchStats.stats,
      pausable: fetchStats.pausable,
    };
  })
);

const data = computed(() => {
  const vmsStats: { label: string; value: number }[] = [];

  for (const key in vmsWithStats.value) {
    const vm = vmsWithStats.value[key];

    const avgCpuUsage = getAvgCpuUsage(vm.stats.value?.stats.cpus);

    if (avgCpuUsage === undefined) {
      continue;
    }

    vmsStats.push({
      label: vm.vmName,
      value: avgCpuUsage,
    });
  }
  return vmsStats;
});

onMounted(() => {
  vmsWithStats.value?.forEach((v) => v.pausable.resume());
});

onUnmounted(() => {
  vmsWithStats.value?.forEach((v) => v.pausable.pause());
});
</script>
