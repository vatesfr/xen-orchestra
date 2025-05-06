<template>
  <div class="vm-ram-usage">
    <VtsLoadingHero v-if="!isReady" type="card" />
    <template v-else>
      <UiProgressBar
        v-for="ramUsage in ramUsages.vm.splice(0, 5)"
        :key="ramUsage.id"
        class="progressBar"
        :value="ramUsage.used?.value ?? 0"
        :max="ramUsage.total?.value"
        :legend="ramUsage.name"
      />
      <div class="total">
        <UiCardNumbers
          :label="$t('total-used')"
          :unit="ramUsages.ramUsageTotal?.prefix"
          :value="ramUsages.ramUsageTotal?.value"
          size="medium"
        />
        <UiCardNumbers
          :label="$t('total-free')"
          :unit="ramUsages.ramFreeTotal?.prefix"
          :value="ramUsages.ramFreeTotal?.value"
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
import { formatSizeRaw } from '@core/utils/size.util'
import { computed } from 'vue'

const { vms } = defineProps<{
  vms: XoVm[]
}>()

const { isReady } = useHostStore().subscribe()

const ramUsages = computed(() => {
  let ramUsageTotal = 0
  let ramFreeTotal = 0
  return {
    vm: vms
      .map(vm => {
        ramUsageTotal += vm.memory.dynamic[0]
        ramFreeTotal += vm.memory.size - vm.memory.dynamic[0]
        return {
          total: formatSizeRaw(vm.memory.size, 0),
          used: formatSizeRaw(vm.memory.dynamic[0], 0),
          free: formatSizeRaw(vm.memory.size - vm.memory.dynamic[0], 0),
          id: vm.id,
          name: vm.name_label,
        }
      })
      .sort(
        (a, b) =>
          // reproduce calcul in progress bar.
          (b.used?.value ?? 0) / ((b.total?.value ?? 0) > 1 ? b.total!.value : 1) -
          (a.used?.value ?? 0) / ((a.total?.value ?? 0) > 1 ? a.total!.value : 1)
      ),
    ramUsageTotal: formatSizeRaw(ramUsageTotal, 0),
    ramFreeTotal: formatSizeRaw(ramFreeTotal, 0),
  }
})
</script>

<style scoped lang="postcss">
.vm-ram-usage {
  .total {
    display: grid;
    grid-template-columns: 1fr 1fr;
    margin-block-start: auto;
  }
}
</style>
