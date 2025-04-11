<template>
  <UiCard class="host-dashboard-cpu-provisioning">
    <UiCardTitle>{{ $t('cpu-provisioning') }}</UiCardTitle>
    <VtsLoadingHero v-if="!isReady" type="card" />
    <template v-else>
      <UiProgressBar :value="cpuProvisioning.used" :max="cpuProvisioning.total" :legend="$t('vcpus')" />
      <div class="total">
        <UiCardNumbers :label="$t('vcpus-used')" :value="cpuProvisioning.used" size="medium" />
        <UiCardNumbers :label="$t('total-cpus')" :value="cpuProvisioning.total" size="medium" />
      </div>
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { useHostStore } from '@/stores/xen-api/host.store.ts'
import { useVmMetricsStore } from '@/stores/xen-api/vm-metrics.store.ts'
import { useVmStore } from '@/stores/xen-api/vm.store.ts'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiProgressBar from '@core/components/ui/progress-bar/UiProgressBar.vue'
import { computed } from 'vue'

const { host } = defineProps<{
  host: XenApiHost
}>()

const { isReady: isHostReady } = useHostStore().subscribe()
const { recordsByHostRef, isReady: areVmsReady } = useVmStore().subscribe()
const { getByOpaqueRef: getVmMetricsByOpaqueRef } = useVmMetricsStore().subscribe()

const isReady = computed(() => isHostReady.value && areVmsReady.value)

const hostVms = computed(() => recordsByHostRef.value.get(host.$ref) ?? [])

const cpuProvisioning = computed(() => {
  const totalHostCpus = Number(host.cpu_info.cpu_count)
  const totalVcpus = hostVms.value.reduce(
    (total, vm) => total + (getVmMetricsByOpaqueRef(vm.metrics)?.VCPUs_number ?? 0),
    0
  )

  return {
    total: totalHostCpus,
    used: totalVcpus,
  }
})
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
