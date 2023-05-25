<template>
  <UiCard :color="hasError ? 'error' : undefined">
    <UiCardTitle>
      {{ $t("cpu-provisioning") }}
      <template v-if="!hasError" #right>
        <!-- TODO: add a tooltip for the warning icon -->
        <UiStatusIcon v-if="state !== 'success'" :state="state" />
      </template>
    </UiCardTitle>
    <NoDataError v-if="hasError" />
    <div v-else-if="isReady" :class="state" class="progress-item">
      <UiProgressBar :max-value="maxValue" :value="value" color="custom" />
      <UiProgressScale :max-value="maxValue" :steps="1" unit="%" />
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
    <UiCardSpinner v-else />
  </UiCard>
</template>

<script lang="ts" setup>
import NoDataError from "@/components/NoDataError.vue";
import UiStatusIcon from "@/components/ui/icon/UiStatusIcon.vue";
import UiProgressBar from "@/components/ui/progress/UiProgressBar.vue";
import UiProgressLegend from "@/components/ui/progress/UiProgressLegend.vue";
import UiProgressScale from "@/components/ui/progress/UiProgressScale.vue";
import UiCard from "@/components/ui/UiCard.vue";
import UiCardFooter from "@/components/ui/UiCardFooter.vue";
import UiCardSpinner from "@/components/ui/UiCardSpinner.vue";
import UiCardTitle from "@/components/ui/UiCardTitle.vue";
import { percent } from "@/libs/utils";
import { useHostMetricsStore } from "@/stores/host-metrics.store";
import { useHostStore } from "@/stores/host.store";
import { useVmMetricsStore } from "@/stores/vm-metrics.store";
import { useVmStore } from "@/stores/vm.store";
import { logicAnd } from "@vueuse/math";
import { computed } from "vue";

const ACTIVE_STATES = new Set(["Running", "Paused"]);

const {
  hasError: hostStoreHasError,
  isReady: isHostStoreReady,
  runningHosts,
} = useHostStore().subscribe({
  hostMetricsSubscription: useHostMetricsStore().subscribe(),
});

const {
  hasError: vmStoreHasError,
  isReady: isVmStoreReady,
  records: vms,
} = useVmStore().subscribe();

const { getByOpaqueRef: getVmMetrics, isReady: isVmMetricsStoreReady } =
  useVmMetricsStore().subscribe();

const nPCpu = computed(() =>
  runningHosts.value.reduce(
    (total, host) => total + Number(host.cpu_info.cpu_count),
    0
  )
);

const nVCpuInUse = computed(() => {
  if (!isReady.value) {
    return 0;
  }

  return vms.value.reduce(
    (total, vm) =>
      ACTIVE_STATES.has(vm.power_state)
        ? total + getVmMetrics(vm.metrics)!.VCPUs_number
        : total,
    0
  );
});
const value = computed(() =>
  Math.round(percent(nVCpuInUse.value, nPCpu.value))
);
const maxValue = computed(() => Math.ceil(value.value / 100) * 100);
const state = computed(() => (value.value > 100 ? "warning" : "success"));
const isReady = logicAnd(
  isVmStoreReady,
  isHostStoreReady,
  isVmMetricsStoreReady
);
const hasError = computed(
  () => hostStoreHasError.value || vmStoreHasError.value
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
</style>
