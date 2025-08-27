<template>
  <UiCard :class="{ 'card-error': error }">
    <UiCardTitle>
      {{ t('ram-usage') }}
      <template #description>{{ t('last-week') }}</template>
    </UiCardTitle>
    <VtsStateHero v-if="loading || data.stats === undefined" format="card" busy />
    <VtsStateHero v-else-if="error" format="card" type="error" image-size="medium">
      {{ t('error-no-data') }}
    </VtsStateHero>
    <VtsStateHero v-else-if="memoryUsage.length === 0" format="card" type="no-data" image-size="medium">
      {{ t('no-data-to-calculate') }}
    </VtsStateHero>
    <VtsLinearChart v-else :data="memoryUsage" :max-value :value-formatter="byteFormatter" />
  </UiCard>
</template>

<script lang="ts" setup>
import { RRD_STEP_FROM_STRING } from '@/libs/xapi-stats.ts'
import type { LinearChartData } from '@core/types/chart.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import type { XapiHostStatsRaw } from '@vates/types/common'
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'

const { data } = defineProps<{
  data: {
    stats: XapiHostStatsRaw | undefined
    timestampStart: number
  }
  loading: boolean
  error?: string
}>()

const VtsLinearChart = defineAsyncComponent(() => import('@core/components/linear-chart/VtsLinearChart.vue'))

const { t } = useI18n()

const memoryUsage = computed<LinearChartData>(() => {
  const { stats, timestampStart } = data
  const { memory: memoryTotal, memoryFree } = stats ?? {}

  if (memoryTotal === undefined || memoryFree === undefined) {
    return []
  }

  const result = memoryTotal.map((total, hourIndex) => ({
    timestamp: (timestampStart + hourIndex * RRD_STEP_FROM_STRING.hours) * 1000,
    value: (total ?? NaN) - (memoryFree[hourIndex] ?? NaN),
  }))

  return [
    {
      label: t('stacked-ram-usage'),
      data: result,
    },
  ]
})

const maxValue = computed(() => {
  if (!data.stats?.memory?.length) {
    return 1024 * 1024 * 1024 // 1 GB as fallback
  }

  return Math.max(...data.stats.memory.map(value => value || 0), 0)
})

const byteFormatter = (value: number | null) => {
  if (value === null) {
    return ''
  }

  const size = formatSizeRaw(value, 1)

  return `${size.value} ${size.prefix}`
}
</script>

<style scoped lang="postcss">
.card-error {
  background-color: var(--color-danger-background-selected);
}
</style>
