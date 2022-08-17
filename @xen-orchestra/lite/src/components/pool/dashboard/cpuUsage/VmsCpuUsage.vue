<template>
  <div>
    <UsageBar :data="data" :n-items="5">
      <template #header>
        <span>VMs</span>
        <span>Top 5</span>
      </template>
    </UsageBar>
  </div>
</template>
<script lang="ts" setup>
import { forEach, size } from "lodash";
import { computed, ref, watchEffect } from "vue";
import UsageBar from "@/components/UsageBar.vue";
import useFetchStats from "@/composables/fetch-stats.composable";
import { getStatsLength } from "@/libs/utils";
import { GRANULARITY, type VmStats } from "@/libs/xapi-stats";
import type { XenApiVm } from "@/libs/xen-api";
import { useVmStore } from "@/stores/vm.store";

const vmStore = useVmStore();

const _runningVms = computed(() =>
  vmStore.allRecords
    .filter((vm) => vm.power_state === "Running")
    .map((vm) => ({ uuid: vm.uuid, name_label: vm.name_label }))
);

const runningVms = ref<XenApiVm[]>([]);

// If using directly the _runningVms computed, vmsWithStats is recomputed every x secondes...
const vmsWithStats = computed(() =>
  runningVms.value.map((vm) => ({
    vmName: vm.name_label,
    stats: useFetchStats<VmStats>("vm", vm.uuid, GRANULARITY.Seconds).stats,
  }))
);

const data = computed(() => {
  const vmsStats: { label: string; value: number }[] = [];

  for (const key in vmsWithStats.value) {
    const vm = vmsWithStats.value[key];
    const cpusStats = vm.stats.value?.stats.cpus;
    const length = getStatsLength(cpusStats);
    if (length === undefined) {
      continue;
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
    vmsStats.push({
      label: vm.vmName,
      value: avgUsage,
    });
  }
  return vmsStats;
});

watchEffect(() => {
  vmStore.allRecords.forEach((vm) => {
    if (vm.power_state === "Running") {
      if (runningVms.value.find((_vm) => _vm.uuid === vm.uuid) === undefined) {
        runningVms.value.push(vm);
      }
    } else {
      const index = runningVms.value.findIndex((_vm) => _vm.uuid === vm.uuid);
      if (index >= 0) {
        runningVms.value.splice(index, 1);
      }
    }
  });
});
</script>
