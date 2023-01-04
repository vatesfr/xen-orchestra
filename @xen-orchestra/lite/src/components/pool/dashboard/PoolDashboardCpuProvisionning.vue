<template>
  <UiCard>
    <UiTitle type="h4">{{ $t("cpu-provisioning") }}</UiTitle>
    <div v-if="isReady" class="progress-item">
      <UiProgressBar :value="nVCpuInUse" :max-value="nPCpu * SCALE" />
      <UiScaleProgressBar :scale="SCALE" />
      <UiLegendProgressBar>
        <template #label>{{ $t("vcpus") }}</template>
        <template #value>{{ value }}%</template>
      </UiLegendProgressBar>
      <div class="footer">
        <div class="footer-card">
          <p>{{ $t("vcpus-used") }}</p>
          <span class="footer-value">{{ nVCpuInUse }}</span>
        </div>
        <div class="footer-card">
          <p>{{ $t("total-cpus") }}</p>
          <span class="footer-value">{{ nPCpu }}</span>
        </div>
      </div>
    </div>
    <UiSpinner v-else class="spinner" />
  </UiCard>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import UiCard from "@/components/ui/UiCard.vue";
import UiLegendProgressBar from "@/components/ui/UiLegendProgressBar.vue";
import UiProgressBar from "@/components/ui/UiProgressBar.vue";
import UiScaleProgressBar from "@/components/ui/UiScaleProgressBar.vue";
import UiSpinner from "@/components/ui/UiSpinner.vue";
import UiTitle from "@/components/ui/UiTitle.vue";
import { percent } from "@/libs/utils";
import { usePoolStore } from "@/stores/pool.store";
import { useVmMetricsStore } from "@/stores/vm-metrics.store";
import { useVmStore } from "@/stores/vm.store";

const SCALE = 2;

const { pool, isReady: poolStoreIsReady } = storeToRefs(usePoolStore());
const { allRecords: vms, isReady: vmStoreIsReady } = storeToRefs(useVmStore());
const vmMetricsStore = useVmMetricsStore();

const nPCpu = computed(() => +(pool.value?.cpu_info.cpu_count ?? 0));
const nVCpuInUse = computed(() =>
  vms.value
    .filter((vm) => vm.power_state === "Running" || vm.power_state === "Paused")
    .reduce(
      (total, vm) => total + vmMetricsStore.getRecord(vm.metrics).VCPUs_number,
      0
    )
);
const value = computed(() =>
  Math.round(percent(nVCpuInUse.value, nPCpu.value))
);
const isReady = computed(
  () => vmStoreIsReady.value && vmMetricsStore.isReady && poolStoreIsReady.value
);
</script>

<style scoped>
.progress-item {
  margin-top: 2.6rem;
  --progress-bar-height: 1.2rem;
  --progress-bar-color: var(--color-extra-blue-base);
  --progress-bar-background-color: var(--color-blue-scale-400);
}
.footer {
  display: flex;
  justify-content: space-between;
  font-weight: 700;
  font-size: 14px;
  color: var(--color-blue-scale-300);
}
.footer-card {
  color: var(--color-blue-scale-200);
  display: flex;
  text-transform: uppercase;
  width: 45%;
}

.footer-card p {
  font-weight: 700;
  width: 100%;
}

.spinner {
  color: var(--color-extra-blue-base);
  display: flex;
  margin: 2.6rem auto auto auto;
  width: 40px;
  height: 40px;
}
</style>
