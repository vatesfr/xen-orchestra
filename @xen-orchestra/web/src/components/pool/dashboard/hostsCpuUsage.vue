<template>
  <div class="hosts-cpu-usage">
    <VtsLoadingHero v-if="!areHostReady && !areVmsReady" type="card" />
    <template v-else>
      <UiProgressBar
        v-for="cpuUsage in cpuUsages.hosts.splice(0, 5)"
        :key="cpuUsage.id"
        class="progressBar"
        :value="cpuUsage.used ?? 0"
        :max="cpuUsage.total"
        :legend="cpuUsage.name"
      />
      <div class="total">
        <UiCardNumbers
          :label="$t('total-used')"
          :unit="$t('vcpus', cpuUsages.cpuUsageTotal)"
          :value="cpuUsages.cpuUsageTotal"
          size="medium"
        />
        <UiCardNumbers
          :label="$t('total-free')"
          :unit="$t('vcpus', cpuUsages.cpuFreeTotal)"
          :value="cpuUsages.cpuFreeTotal"
          size="medium"
        />
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import { useVmStore } from '@/stores/xo-rest-api/vm.store'
import type { XoHost } from '@/types/xo/host.type'
import type { XoVm } from '@/types/xo/vm.type'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiProgressBar from '@core/components/ui/progress-bar/UiProgressBar.vue'
import { computed } from 'vue'

const { hosts } = defineProps<{
  hosts: XoHost[]
  vms: XoVm[]
}>()

const { isReady: areHostReady } = useHostStore().subscribe()
const { vmsByHost, isReady: areVmsReady } = useVmStore().subscribe()

const cpuUsages = computed(() => {
  let cpuUsageTotal = 0
  let cpuFreeTotal = 0
  return {
    hosts: hosts
      .map(host => {
        const vms = vmsByHost.value.get(host.id)
        const vmsCpuNumber = vms?.reduce((cpuUsed, vm) => cpuUsed + vm.CPUs.number, 0) ?? 0
        const cpuFree = host.cpus.cores - vmsCpuNumber

        cpuUsageTotal += vmsCpuNumber
        cpuFreeTotal += cpuFree

        return {
          total: host.cpus.cores,
          used: vmsCpuNumber,
          free: cpuFree,
          id: host.id,
          name: host.name_label,
        }
      })
      .sort(
        (a, b) =>
          // reproduce calcul in progress bar.
          b.used / (b.total > 1 ? b.total : 1) - a.used / (a.total > 1 ? a.total : 1)
      ),
    cpuUsageTotal,
    cpuFreeTotal,
  }
})
</script>

<style scoped lang="postcss">
.hosts-cpu-usage {
  .total {
    display: grid;
    grid-template-columns: 1fr 1fr;
    margin-block-start: auto;
  }
}
</style>
