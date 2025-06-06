<template>
  <UiCard class="host-dashboard-cpu-provisioning">
    <UiCardTitle>{{ t('cpu-provisioning') }}</UiCardTitle>
    <VtsLoadingHero v-if="!isReady" type="card" />
    <template v-else>
      <UiProgressBar :value="vCpusCount" :max="cpusCount" :legend="t('vcpus')" />
      <div class="total">
        <UiCardNumbers :label="t('vcpus-assigned')" :value="vCpusCount" size="medium" />
        <UiCardNumbers :label="t('total-cpus')" :value="cpusCount" size="medium" />
      </div>
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import { VM_POWER_STATE } from '@/libs/xen-api/xen-api.enums.ts'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { useHostStore } from '@/stores/xen-api/host.store.ts'
import { useVmMetricsStore } from '@/stores/xen-api/vm-metrics.store.ts'
import { useVmStore } from '@/stores/xen-api/vm.store.ts'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiProgressBar from '@core/components/ui/progress-bar/UiProgressBar.vue'
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
    if (vm.power_state !== VM_POWER_STATE.RUNNING && vm.power_state !== VM_POWER_STATE.PAUSED) {
      return total
    }

    return total + (getVmMetricsByOpaqueRef(vm.metrics)?.VCPUs_number ?? 0)
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
