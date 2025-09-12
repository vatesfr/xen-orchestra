<template>
  <UiCard class="host-dashboard-cpu-provisioning">
    <UiCardTitle>{{ t('cpu-provisioning') }}</UiCardTitle>
    <VtsStateHero v-if="!isReady" format="card" busy size="medium" />
    <template v-else>
      <VtsProgressBar
        :current="vCpusCount"
        :label="t('vcpus')"
        :thresholds="cpuProgressThresholds(t('cpu-provisioning-warning'))"
        :total="cpusCount"
        legend-type="percent"
      />
      <div class="total">
        <UiCardNumbers :label="t('vcpus-assigned')" :value="vCpusCount" size="medium" />
        <UiCardNumbers :label="t('total-cpus')" :value="cpusCount" size="medium" />
      </div>
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import { ACTIVE_STATES } from '@/libs/utils'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { useHostStore } from '@/stores/xen-api/host.store.ts'
import { useVmMetricsStore } from '@/stores/xen-api/vm-metrics.store.ts'
import { useVmStore } from '@/stores/xen-api/vm.store.ts'
import VtsProgressBar from '@core/components/progress-bar/VtsProgressBar.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { cpuProgressThresholds } from '@core/utils/progress.util.ts'
import { and } from '@vueuse/math'
import { useArrayReduce } from '@vueuse/shared'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XenApiHost
}>()

const { t } = useI18n()

const { isReady: isHostReady } = useHostStore().subscribe()
const { recordsByHostRef, isReady: isVmReady } = useVmStore().subscribe()
const { getByOpaqueRef: getVmMetricsByOpaqueRef, isReady: isVmMetricsReady } = useVmMetricsStore().subscribe()

const isReady = and(isHostReady, isVmReady, isVmMetricsReady)

const hostVms = computed(() => recordsByHostRef.value.get(host.$ref) ?? [])

const cpusCount = computed(() => Number(host.cpu_info.cpu_count))

const vCpusCount = useArrayReduce(
  hostVms,
  (total, vm) => {
    if (ACTIVE_STATES.has(vm.power_state)) {
      return total + (getVmMetricsByOpaqueRef(vm.metrics)?.VCPUs_number ?? vm.VCPUs_at_startup)
    }

    return total + vm.VCPUs_at_startup
  },
  0
)
</script>

<style lang="postcss" scoped>
.host-dashboard-cpu-provisioning {
  .total {
    display: grid;
    grid-template-columns: 1fr 1fr;
    margin-block-start: auto;
  }
}
</style>
