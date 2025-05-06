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
    </template>
  </div>
</template>

<script lang="ts" setup>
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import { useVmStore } from '@/stores/xo-rest-api/vm.store'
import type { XoHost } from '@/types/xo/host.type'
import type { XoVm } from '@/types/xo/vm.type'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiProgressBar from '@core/components/ui/progress-bar/UiProgressBar.vue'
import { computed } from 'vue'

const { hosts } = defineProps<{
  hosts: XoHost[]
  vms: XoVm[]
}>()

const { isReady: areHostReady } = useHostStore().subscribe()
const { vmsByHost, isReady: areVmsReady } = useVmStore().subscribe()

const cpuUsages = computed(() => {
  return {
    hosts: hosts
      .map(host => {
        const vmsCpuNumber = vmsByHost.value.get(host.id)?.reduce((cpuUsed, vm) => cpuUsed + vm.CPUs.number, 0) ?? 0

        return {
          total: host.cpus.cores,
          used: vmsCpuNumber,
          free: host.cpus.cores - vmsCpuNumber,
          id: host.id,
          name: host.name_label,
        }
      })
      .sort(
        (a, b) =>
          // reproduce calcul in progress bar.
          b.used / (b.total > 1 ? b.total : 1) - a.used / (a.total > 1 ? a.total : 1)
      ),
  }
})
</script>
