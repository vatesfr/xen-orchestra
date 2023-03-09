<template>
  <UiCard>
    <UiCardTitle>
      {{ $t("cpu-provisioning") }}
      <template #right>
        <!-- TODO: add a tooltip for the warning icon -->
        <UiStatusIcon v-if="state !== 'success'" :state="state" />
      </template>
    </UiCardTitle>
    <div v-if="isReady" class="progress-item" :class="state">
      <UiProgressBar color="custom" :value="value" :max-value="maxValue" />
      <UiProgressScale :max-value="maxValue" unit="%" :steps="1" />
      <UiProgressLegend :label="$t('vcpus')" :value="`${value}%`" />
      <UiCardFooter>
        <template #left>
          <p>{{ $t("vcpus-used") }}</p>
          <p class="footer-value">{{ nVCpuInUse }}</p>
        </template>
        <template #right>
          <p>{{ $t("total-cpus") }}</p>
          <p class="footer-value">{{ nPCpu }}</p>
        </template>
      </UiCardFooter>
    </div>
    <UiSpinner v-else class="spinner" />
  </UiCard>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import UiCard from "@/components/ui/UiCard.vue";
import UiCardFooter from "@/components/ui/UiCardFooter.vue";
import UiCardTitle from "@/components/ui/UiCardTitle.vue";
import UiProgressBar from "@/components/ui/progress/UiProgressBar.vue";
import UiProgressLegend from "@/components/ui/progress/UiProgressLegend.vue";
import UiProgressScale from "@/components/ui/progress/UiProgressScale.vue";
import UiSpinner from "@/components/ui/UiSpinner.vue";
import UiStatusIcon from "@/components/ui/icon/UiStatusIcon.vue";
import { isHostRunning, percent } from "@/libs/utils";
import { useHostStore } from "@/stores/host.store";
import { useVmMetricsStore } from "@/stores/vm-metrics.store";
import { useVmStore } from "@/stores/vm.store";

const ACTIVE_STATES = new Set(["Running", "Paused"]);

const { allRecords: hosts, isReady: hostStoreIsReady } = storeToRefs(
  useHostStore()
);
const { allRecords: vms, isReady: vmStoreIsReady } = storeToRefs(useVmStore());
const vmMetricsStore = useVmMetricsStore();

const nPCpu = computed(() =>
  hosts.value.reduce(
    (total, host) =>
      isHostRunning(host) ? total + Number(host.cpu_info.cpu_count) : total,
    0
  )
);
const nVCpuInUse = computed(() =>
  vms.value.reduce(
    (total, vm) =>
      ACTIVE_STATES.has(vm.power_state)
        ? total + vmMetricsStore.getRecord(vm.metrics).VCPUs_number
        : total,
    0
  )
);
const value = computed(() =>
  Math.round(percent(nVCpuInUse.value, nPCpu.value))
);
const maxValue = computed(() => Math.ceil(value.value / 100) * 100);
const state = computed(() => (value.value > 100 ? "warning" : "success"));
const isReady = computed(
  () => vmStoreIsReady.value && vmMetricsStore.isReady && hostStoreIsReady.value
);
</script>

<style lang="postcss" scoped>
.progress-item {
  margin-top: 2.6rem;
  --progress-bar-height: 1.2rem;
  --progress-bar-color: var(--color-extra-blue-base);
  --progress-bar-background-color: var(--color-blue-scale-400);
  &.warning {
    --progress-bar-color: var(--color-orange-world-base);
    --footer-value-color: var(--color-orange-world-base);
  }
  & .footer-value {
    color: var(--footer-value-color);
  }
}
.spinner {
  color: var(--color-extra-blue-base);
  display: flex;
  margin: 2.6rem auto auto auto;
  width: 40px;
  height: 40px;
}
</style>
