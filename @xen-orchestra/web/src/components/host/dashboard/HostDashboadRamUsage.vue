<template>
  <UiCard class="host-dashboard-ram-usage">
    <UiCardTitle>{{ $t('ram-usage') }}</UiCardTitle>
    <VtsLoadingHero :disabled="isReady" type="card">
      <UiProgressBar :value="ramUsage.used?.value ?? 0" :max="ramUsage.total?.value" :legend="host.name_label" />
      <div class="total">
        <UiCardNumbers
          :label="$t('total-used')"
          :unit="ramUsage.used?.prefix"
          :value="ramUsage.used?.value"
          size="medium"
        />
        <UiCardNumbers
          :label="$t('total-free')"
          :unit="ramUsage.free?.prefix"
          :value="ramUsage.free?.value"
          size="medium"
        />
      </div>
    </VtsLoadingHero>
  </UiCard>
</template>

<script lang="ts" setup>
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import type { XoHost } from '@/types/xo/host.type'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiProgressBar from '@core/components/ui/progress-bar/UiProgressBar.vue'
import { formatSizeRaw } from '@core/utils/size.util'
import { computed } from 'vue'

const { host } = defineProps<{
  host: XoHost
}>()

const { isReady } = useHostStore().subscribe()

const ramUsage = computed(() => {
  const total = host.memory.size
  const used = host.memory.usage

  return {
    total: formatSizeRaw(total, 0),
    used: formatSizeRaw(used, 0),
    free: formatSizeRaw(total - used, 0),
  }
})
</script>

<style lang="postcss" scoped>
.host-dashboard-ram-usage {
  .total {
    display: grid;
    grid-template-columns: 1fr 1fr;
    margin-block-start: auto;
  }
}
</style>
