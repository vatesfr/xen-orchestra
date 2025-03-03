<template>
  <UiCard class="host-dashboard-cpu-provisioning">
    <UiCardTitle>{{ $t('cpu-provisioning') }}</UiCardTitle>
    <VtsLoadingHero :disabled="isReady" type="card">
      <UiProgressBar :value="cpuProvisioning.used" :max="cpuProvisioning.total" :legend="$t('vcpus')" />
      <div class="total">
        <UiCardNumbers :label="$t('vcpus-used')" :value="cpuProvisioning.used" size="medium" />
        <UiCardNumbers :label="$t('total-cpus')" :value="cpuProvisioning.total" size="medium" />
      </div>
    </VtsLoadingHero>
  </UiCard>
</template>

<script lang="ts" setup>
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import { useVmStore } from '@/stores/xo-rest-api/vm.store'
import type { XoHost } from '@/types/xo/host.type'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiProgressBar from '@core/components/ui/progress-bar/UiProgressBar.vue'
import { computed } from 'vue'

const { host } = defineProps<{
  host: XoHost
}>()

const { isReady: isHostReady } = useHostStore().subscribe()
const { vmsByHost, isReady: areVmsReady } = useVmStore().subscribe()

const isReady = computed(() => isHostReady.value && areVmsReady.value)

const hostVms = computed(() => vmsByHost.value.get(host.id) ?? [])

const cpuProvisioning = computed(() => {
  const totalHostCpus = host.cpus.cores
  const totalVcpus = hostVms.value.reduce((acc, vm) => acc + (vm.CPUs?.number ?? 0), 0)

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
