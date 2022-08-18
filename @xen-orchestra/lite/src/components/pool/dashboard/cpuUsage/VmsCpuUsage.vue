<template>
  <div v-if="data.length !== 0">
    <UsageBar :data="data" :n-items="5">
      <template #header>
        <span>VMs</span>
        <span>Top 5</span>
      </template>
    </UsageBar>
  </div>
</template>
<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, watchEffect } from "vue";
import UsageBar from "@/components/UsageBar.vue";
import useFetchStats from "@/composables/fetch-stats.composable";
import { getAvgCpuUsage } from "@/libs/utils";
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
// If using directly the _runningVms computed, vmsWithStats is recomputed every x secondes.
const vmsWithStats = computed(() =>
  runningVms.value.map((vm) => {
    const fetchStats = useFetchStats<VmStats>(
      "vm",
      vm.uuid,
      GRANULARITY.Seconds
    );
    return {
      vmName: vm.name_label,
      stats: fetchStats.stats,
      pausable: fetchStats.pausable,
    };
  })
);

const pausableStats = computed(() =>
  vmsWithStats.value.map((vm) => vm.pausable)
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

watchEffect(() => {
  vmStore.allRecords.forEach((vm) => {
    const index = runningVms.value.findIndex((_vm) => _vm.uuid === vm.uuid);
    if (vm.power_state === "Running" && index === -1) {
      runningVms.value.push(vm);
    } else if (vm.power_state !== "Running" && index >= 0) {
      runningVms.value.splice(index, 1);
    }
  });
});

onMounted(() => {
  pausableStats.value.forEach((p) => p.resume());
});

onUnmounted(() => {
  pausableStats.value.forEach((p) => p.pause());
});
</script>
