<template>
  <UiCard :color="hasError ? 'error' : undefined">
    <UiCardTitle>
      {{ t('cpu-provisioning') }}
      <template v-if="!hasError" #right>
        <VtsIcon
          v-if="state === 'warning'"
          v-tooltip="{
            content: t('cpu-provisioning-warning'),
            placement: 'left',
          }"
          name="legacy:status:warning"
          size="medium"
        />
      </template>
    </UiCardTitle>
    <NoDataError v-if="hasError" />
    <div v-else-if="isReady" :class="state" class="progress-item">
      <UiProgressBar :max-value="maxValue" :value color="custom" />
      <UiProgressScale :max-value="maxValue" :steps="1" unit="%" />
      <UiProgressLegend :label="t('vcpus')" :value="n(value / 100, 'percent')" />
      <UiCardFooter class="ui-card-footer">
        <template #left>
          <p>{{ t('vcpus-assigned') }}</p>
          <p class="footer-value">{{ nVcpuAssigned }}</p>
        </template>
        <template #right>
          <p>{{ t('total-cpus') }}</p>
          <p class="footer-value">{{ nPCpu }}</p>
        </template>
      </UiCardFooter>
    </div>
    <UiCardSpinner v-else />
  </UiCard>
</template>

<script lang="ts" setup>
import NoDataError from '@/components/NoDataError.vue'
import UiProgressBar from '@/components/ui/progress/UiProgressBar.vue'
import UiProgressLegend from '@/components/ui/progress/UiProgressLegend.vue'
import UiProgressScale from '@/components/ui/progress/UiProgressScale.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiCardFooter from '@/components/ui/UiCardFooter.vue'
import UiCardSpinner from '@/components/ui/UiCardSpinner.vue'
import UiCardTitle from '@/components/ui/UiCardTitle.vue'
import { ACTIVE_STATES, percent } from '@/libs/utils'
import { useHostStore } from '@/stores/xen-api/host.store'
import { useVmMetricsStore } from '@/stores/xen-api/vm-metrics.store'
import { useVmStore } from '@/stores/xen-api/vm.store'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, n } = useI18n()

const { hasError: hostStoreHasError, isReady: isHostStoreReady, runningHosts } = useHostStore().subscribe()

const { hasError: vmStoreHasError, isReady: isVmStoreReady, records: vms } = useVmStore().subscribe()

const { getByOpaqueRef: getVmMetrics, isReady: isVmMetricsStoreReady } = useVmMetricsStore().subscribe()

const isReady = logicAnd(isVmStoreReady, isHostStoreReady, isVmMetricsStoreReady)

const nPCpu = computed(() => runningHosts.value.reduce((total, host) => total + Number(host.cpu_info.cpu_count), 0))

const nVcpuAssigned = computed(() => {
  if (!isReady.value) {
    return 0
  }

  return vms.value.reduce((total, vm) => {
    if (ACTIVE_STATES.has(vm.power_state)) {
      return total + (getVmMetrics(vm.metrics)?.VCPUs_number ?? vm.VCPUs_at_startup)
    }

    return total + vm.VCPUs_at_startup
  }, 0)
})
const value = computed(() => Math.round(percent(nVcpuAssigned.value, nPCpu.value)))
const maxValue = computed(() => Math.ceil(value.value / 100) * 100)
const state = computed(() => (value.value > 100 ? 'warning' : 'success'))

const hasError = computed(() => hostStoreHasError.value || vmStoreHasError.value)
</script>

<style lang="postcss" scoped>
.progress-item {
  margin-top: 2.6rem;
  --progress-bar-height: 1.2rem;
  --progress-bar-color: var(--color-brand-item-base);
  --progress-bar-background-color: var(--color-neutral-background-disabled);

  &.warning {
    --progress-bar-color: var(--color-warning-item-base);
    --footer-value-color: var(--color-warning-item-base);
  }

  & .footer-value {
    color: var(--footer-value-color);
  }
}

.ui-card-footer {
  margin-top: 2rem;
}
</style>
