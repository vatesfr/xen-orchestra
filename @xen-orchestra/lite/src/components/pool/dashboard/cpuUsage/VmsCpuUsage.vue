<template>
  <UsageBar :data="data" :n-items="5">
    <template #header>
      <span>VMs</span>
      <span>Top 5</span>
    </template>
  </UsageBar>
</template>
<script lang="ts" setup>
import { differenceBy } from "lodash-es";
import { computed, onMounted, watch } from "vue";
import UsageBar from "@/components/UsageBar.vue";
import useFetchStats from "@/composables/fetch-stats.composable";
import { getAvgCpuUsage } from "@/libs/utils";
import { GRANULARITY, type VmStats } from "@/libs/xapi-stats";
import type { XenApiVm } from "@/libs/xen-api";
import { useVmStore } from "@/stores/vm.store";

const { register, unregister, stats } = useFetchStats<XenApiVm, VmStats>(
  "vm",
  GRANULARITY.Seconds
);

const vmStore = useVmStore();

const runningVms = computed(() =>
  vmStore.allRecords.filter((vm) => vm.power_state === "Running")
);

watch(runningVms, (vms, previousVms) => {
  // VMs turned On
  differenceBy(vms, previousVms ?? [], "uuid").forEach(register);

  // VMs turned Off
  differenceBy(previousVms, vms, "uuid").forEach(unregister);
});

const data = computed<{ label: string; value: number }[]>(() => {
  const result: { label: string; value: number }[] = [];

  stats.value.forEach((stat) => {
    if (!stat.stats) {
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

onMounted(() => {
  runningVms.value.forEach(register);
});
</script>
