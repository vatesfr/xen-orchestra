<template>
  <UiCard>
    <UiTitle type="h4" class="title">
      {{ $t("cpu-provisioning") }}
      <!-- TODO: add a tooltip for the warning icon -->
      <UiIcon v-if="state === 'warning'" :icon="faWarning" />
    </UiTitle>
    <div v-if="isReady" class="progress-item" :class="state">
      <UiProgressBar color="custom" :value="nVCpuInUse" :max-value="maxValue" />
      <UiUnitProgressBar :max-value="maxValue" />
      <UiLegendProgressBar>
        <template #label>{{ $t("vcpus") }}</template>
        <template #value>{{ value }}%</template>
      </UiLegendProgressBar>
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
import UiIcon from "@/components/ui/UiIcon.vue";
import UiLegendProgressBar from "@/components/ui/UiLegendProgressBar.vue";
import UiProgressBar from "@/components/ui/UiProgressBar.vue";
import UiUnitProgressBar from "@/components/ui/UiUnitProgressBar.vue";
import UiSpinner from "@/components/ui/UiSpinner.vue";
import UiTitle from "@/components/ui/UiTitle.vue";
import { faWarning } from "@fortawesome/free-solid-svg-icons";
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
const state = computed(() => (value.value > 100 ? "warning" : "ok"));
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

.title {
  display: flex;
  justify-content: space-between;
  & .ui-icon {
    color: var(--color-orange-world-base);
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
