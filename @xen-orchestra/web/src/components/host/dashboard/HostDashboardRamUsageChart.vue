<template>
  <UiCard>
    <UiCardTitle>
      {{ t('ram-usage') }}
      <template #description>{{ t('last-week') }}</template>
    </UiCardTitle>
    <VtsLoadingHero v-if="loading || data === null" type="card" />
    <VtsErrorNoDataHero v-else-if="error" type="card" />
    <VtsLinearChart v-else :data="ramUsage" :max-value :value-formatter="byteFormatter" />
  </UiCard>
</template>

<script lang="ts" setup>
import type { XoHostStats } from '@/types/xo/host-stats.type.ts'
import type { LinearChartData } from '@core/types/chart.ts'
import VtsErrorNoDataHero from '@core/components/state-hero/VtsErrorNoDataHero.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'

const { data } = defineProps<{
  data: XoHostStats | null
  loading: boolean
  error?: string
}>()

const VtsLinearChart = defineAsyncComponent(() => import('@core/components/linear-chart/VtsLinearChart.vue'))

const { t } = useI18n()

const ramUsage = computed<LinearChartData>(() => {
  if (!data?.stats.memory || !data?.stats.memoryFree) {
    return []
  }

  const memoryTotalValues = data.stats.memory
  const memoryFreeValues = data.stats.memoryFree
  const result = new Map<number, { timestamp: number; value: number }>()
  const timestampStart = data.endTimestamp - data.interval * (memoryTotalValues.length - 1)

  for (let hourIndex = 0; hourIndex < memoryTotalValues.length; hourIndex++) {
    const timestamp = (timestampStart + hourIndex * data.interval) * 1000
    const memoryTotal = memoryTotalValues[hourIndex]
    const memoryFree = memoryFreeValues[hourIndex]
    const memoryUsed = memoryTotal - memoryFree

    result.set(timestamp, {
      timestamp,
      value: memoryUsed,
    })
  }

  return [
    {
      label: t('ram-usage'),
      data: Array.from(result.values()),
    },
  ]
})

const maxValue = computed(() => {
  if (!data?.stats.memory?.length) {
    return 1024 * 1024 * 1024 // 1 GB as fallback
  }

  return Math.max(...data.stats.memory, 0)
})

const byteFormatter = (value: number) => {
  const result = formatSizeRaw(value, 1)

  return `${result?.value}${result?.prefix}`
}
</script>
