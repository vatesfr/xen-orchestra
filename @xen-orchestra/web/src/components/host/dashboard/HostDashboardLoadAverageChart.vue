<template>
  <UiCard>
    <UiCardTitle>
      {{ t('load-average') }}
      <template #description>{{ t('last-week') }}</template>
    </UiCardTitle>
    <VtsLoadingHero v-if="loading || data === null" type="card" />
    <VtsErrorNoDataHero v-else-if="error" type="card" />
    <VtsLinearChart v-else :data="loadAverage" :max-value />
  </UiCard>
</template>

<script lang="ts" setup>
import type { XoHostStats } from '@/types/xo/host-stats.type.ts'
import type { LinearChartData } from '@core/types/chart.ts'
import VtsErrorNoDataHero from '@core/components/state-hero/VtsErrorNoDataHero.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'

const { data } = defineProps<{
  data: XoHostStats | null
  loading: boolean
  error?: string
}>()

const VtsLinearChart = defineAsyncComponent(() => import('@core/components/linear-chart/VtsLinearChart.vue'))

const { t } = useI18n()

const loadAverage = computed<LinearChartData>(() => {
  if (!data?.stats.load) {
    return []
  }

  const loadValues = data.stats.load
  const result = new Map<number, { timestamp: number; value: number | string }>()
  const timestampStart = data.endTimestamp - data.interval * (loadValues.length - 1)

  for (let hourIndex = 0; hourIndex < loadValues.length; hourIndex++) {
    const timestamp = (timestampStart + hourIndex * data.interval) * 1000
    const load = loadValues[hourIndex]

    result.set(timestamp, {
      timestamp,
      value: load ? Number(load.toFixed(2)) : '',
    })
  }

  return [
    {
      label: t('load-average'),
      data: Array.from(result.values()),
    },
  ]
})

const maxValue = computed(() => {
  const values = loadAverage.value[0]?.data.map(item => Number(item.value) || 0) ?? []
  if (values.length === 0) {
    return 10
  }

  const maxLoad = Math.max(...values)

  return Math.ceil(maxLoad / 5) * 5
})
</script>
