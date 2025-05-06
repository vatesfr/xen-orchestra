<template>
  <UiCard class="host-dashboard-cpu-provisioning">
    <UiCardTitle>{{ $t('cpu-provisioning') }}</UiCardTitle>
    <VtsLoadingHero v-if="!isReady" type="card" />
    <template v-else>
      <UiProgressBar :max="pool.cpus.cores" :legend="$t('vcpus')" :value="cpuProvisioning.used" />
      <div class="total">
        <UiCardNumbers :label="$t('vcpus-used')" :value="cpuProvisioning.used" size="medium" />
        <UiCardNumbers :label="$t('total-cpus')" :value="cpuProvisioning.total" size="medium" />
      </div>
    </template>
  </UiCard>
</template>

<script setup lang="ts">
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import { usePoolStore } from '@/stores/xo-rest-api/pool.store'
import { useVmStore } from '@/stores/xo-rest-api/vm.store'
import type { XoPool } from '@/types/xo/pool.type'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiProgressBar from '@core/components/ui/progress-bar/UiProgressBar.vue'
import { computed } from 'vue'

const { pool } = defineProps<{
  pool: XoPool
}>()

const { isReady: isPoolReady } = usePoolStore().subscribe()
const { isReady: isHostReady } = useHostStore().subscribe()
const { vmsByHost, isReady: areVmsReady, hostLessVmsByPool } = useVmStore().subscribe()
const { hostsByPool, isReady: areHostReady } = useHostStore().subscribe()

const isReady = computed(() => isPoolReady.value && areHostReady.value && isHostReady.value && areVmsReady.value)

const hosts = computed(
  () =>
    // bad optimisation, operation vmsByHost, and reduce is too consuming
    hostsByPool.value.get(pool.id) ?? []
)

const vms = computed(() => [
  ...hosts.value.flatMap(host => vmsByHost.value.get(host.id) ?? []),
  ...(hostLessVmsByPool.value.get(pool.id) ?? []),
])

const cpuProvisioning = computed(() => {
  const totalHostCpus = pool.cpus.cores
  const totalVcpus = vms.value.reduce((acc, vm) => acc + (vm.CPUs?.number ?? 0), 0)

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
