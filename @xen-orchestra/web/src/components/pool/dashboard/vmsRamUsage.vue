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
    </template>
  </div>
</template>

<script lang="ts" setup>
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import type { XoVm } from '@/types/xo/vm.type'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiProgressBar from '@core/components/ui/progress-bar/UiProgressBar.vue'
import { formatSizeRaw } from '@core/utils/size.util'
import { computed } from 'vue'

const { vms } = defineProps<{
  vms: XoVm[]
}>()

const { isReady } = useHostStore().subscribe()

const ramUsages = computed(() => {
  return {
    vm: vms
      .map(vm => {
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
  }
})
</script>
