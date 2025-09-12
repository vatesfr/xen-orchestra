<template>
  <UiCard :has-error="error">
    <UiCardTitle>
      {{ t('network-throughput') }}
      <template #description>{{ t('last-week') }}</template>
    </UiCardTitle>
    <VtsStateHero v-if="loading || data.stats === undefined" format="card" busy size="medium" />
    <VtsStateHero v-else-if="error" format="card" type="error" size="medium">
      {{ t('error-no-data') }}
    </VtsStateHero>
    <VtsStateHero v-else-if="networkUsage.length === 0" format="card" type="no-data" size="medium">
      {{ t('no-data-to-calculate') }}
    </VtsStateHero>
    <VtsLinearChart v-else :data="networkUsage" :max-value :value-formatter="byteFormatter" />
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
  error?: boolean
}>()

const VtsLinearChart = defineAsyncComponent(() => import('@core/components/linear-chart/VtsLinearChart.vue'))

const { t } = useI18n()

const networkUsage = computed<LinearChartData>(() => {
  const { stats, timestampStart } = data
  const { pifs } = stats ?? {}

  if (pifs === undefined) {
    return []
  }

  const addNetworkData = (type: 'rx' | 'tx') => ({
    label: type === 'rx' ? t('network-download') : t('network-upload'),
    data: Object.values(pifs[type])[0].map((_, hourIndex) => ({
      timestamp: (timestampStart + hourIndex * RRD_STEP_FROM_STRING.hours) * 1000,
      value: Object.values(pifs[type]).reduce((sum, values) => sum + (values[hourIndex] ?? NaN), 0),
    })),
  })

  return [addNetworkData('tx'), addNetworkData('rx')]
})

const maxValue = computed(() => {
  const values = networkUsage.value.reduce(
    (acc, series) => [...acc, ...series.data.map(item => item.value || 0)],
    [] as number[]
  )

  if (values.length === 0) {
    return 100
  }

  const maxUsage = Math.max(...values) * 1.2

  return Math.ceil(maxUsage / 100) * 100
})

const byteFormatter = (value: number | null) => {
  if (value === null) {
    return ''
  }

  const size = formatSizeRaw(value, 1)

  return `${size.value} ${size.prefix}`
}
</script>
