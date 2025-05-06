<template>
  <div class="vm-cpu-usage">
    <VtsLoadingHero v-if="!isReady" type="card" />
    <template v-else>
      <UiProgressBar
        v-for="cpuUsage in cpuUsages.vm.splice(0, 5)"
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
import type { XoVm } from '@/types/xo/vm.type'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiProgressBar from '@core/components/ui/progress-bar/UiProgressBar.vue'
import { computed } from 'vue'

const { vms } = defineProps<{
  vms: XoVm[]
}>()

const { isReady } = useHostStore().subscribe()

const cpuUsages = computed(() => {
  return {
    vm: vms
      .map(vm => {
        return {
          total: vm.CPUs.max,
          used: vm.CPUs.number,
          free: vm.CPUs.max - vm.CPUs.number,
          id: vm.id,
          name: vm.name_label,
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

<style scoped lang="postcss">
.vm-cpu-usage {
  .total {
    display: grid;
    grid-template-columns: 1fr 1fr;
    margin-block-start: auto;
  }
}
</style>
