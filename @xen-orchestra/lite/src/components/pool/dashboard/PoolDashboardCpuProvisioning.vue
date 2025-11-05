<template>
  <UiCard :color="hasError ? 'error' : undefined">
    <UiCardTitle>{{ t('cpu-provisioning') }}</UiCardTitle>
    <VtsStateHero v-if="!isReady" format="card" busy size="medium" />
    <VtsStateHero v-else-if="hasError" format="card" type="error" size="medium">
      {{ t('error-no-data') }}
    </VtsStateHero>
    <template v-else>
      <VtsProgressBar
        :current="nVcpuAssigned"
        :total="nPCpu"
        :label="t('vcpus')"
        :thresholds="cpuProgressThresholds(t('cpu-provisioning-warning'))"
        legend-type="percent"
      />
      <div class="cpu-provisioning-numbers">
        <UiCardNumbers :label="t('vcpus-assigned')" :value="nVcpuAssigned" size="medium" />
        <UiCardNumbers :label="t('total-cpus')" :value="nPCpu" size="medium" />
      </div>
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import UiCard from '@/components/ui/UiCard.vue'
import UiCardTitle from '@/components/ui/UiCardTitle.vue'
import { ACTIVE_STATES } from '@/libs/utils'
import { useHostStore } from '@/stores/xen-api/host.store'
import { useVmMetricsStore } from '@/stores/xen-api/vm-metrics.store'
import { useVmStore } from '@/stores/xen-api/vm.store'
import VtsProgressBar from '@core/components/progress-bar/VtsProgressBar.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import { cpuProgressThresholds } from '@core/utils/progress.util.ts'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

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

.cpu-provisioning-numbers {
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin-block-start: auto;
}
</style>
