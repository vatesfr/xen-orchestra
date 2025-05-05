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
        :legend="`${cpuUsage.name} ${cpuUsage.total} ${$t('vcpus', cpuUsages.cpuUsageTotal)}`"
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
import type { XoVm } from '@/types/xo/vm.type'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiProgressBar from '@core/components/ui/progress-bar/UiProgressBar.vue'
import { computed } from 'vue'

const { vms } = defineProps<{
  vms: XoVm[]
}>()

const { isReady } = useHostStore().subscribe()

const cpuUsages = computed(() => {
  let cpuUsageTotal = 0
  let cpuFreeTotal = 0
  return {
    vm: vms.map(vm => {
      cpuUsageTotal += vm.CPUs.number
      cpuFreeTotal += vm.CPUs.max - vm.CPUs.number
      return {
        total: vm.CPUs.max,
        used: vm.CPUs.number,
        free: vm.CPUs.max - vm.CPUs.number,
        id: vm.id,
        name: vm.name_label,
      }
    }),
    cpuUsageTotal,
    cpuFreeTotal,
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
