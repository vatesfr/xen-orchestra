<template>
  <div class="hosts-ram-usage">
    <VtsLoadingHero v-if="!isReady" type="card" />
    <template v-else>
      <UiProgressBar
        v-for="ramUsage in ramUsages.hosts.splice(0, 5)"
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
import type { XoHost } from '@/types/xo/host.type'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiProgressBar from '@core/components/ui/progress-bar/UiProgressBar.vue'
import { formatSizeRaw } from '@core/utils/size.util'
import { computed } from 'vue'

const { hosts } = defineProps<{
  hosts: XoHost[]
}>()

const { isReady } = useHostStore().subscribe()

const ramUsages = computed(() => {
  let ramUsageTotal = 0
  let ramFreeTotal = 0
  return {
    hosts: hosts.map(host => {
      ramUsageTotal += host.memory.usage
      ramFreeTotal += host.memory.size - host.memory.usage
      return {
        total: formatSizeRaw(host.memory.size, 0),
        used: formatSizeRaw(host.memory.usage, 0),
        free: formatSizeRaw(host.memory.size - host.memory.usage, 0),
        id: host.id,
        name: host.name_label,
      }
    }),
    ramUsageTotal: formatSizeRaw(ramUsageTotal, 0),
    ramFreeTotal: formatSizeRaw(ramFreeTotal, 0),
  }
})
</script>

<style scoped lang="postcss">
.hosts-ram-usage {
  .total {
    display: grid;
    grid-template-columns: 1fr 1fr;
    margin-block-start: auto;
  }
}
</style>
