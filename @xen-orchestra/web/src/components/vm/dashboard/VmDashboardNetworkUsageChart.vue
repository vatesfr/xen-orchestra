<template>
  <UiCard>
    <UiCardTitle>
      {{ t('network-throughput') }}
      <template #description>{{ t('last-week') }}</template>
    </UiCardTitle>
    <VtsLoadingHero v-if="loading" type="card" />
    <VtsErrorNoDataHero v-else-if="error" type="card" />
    <VtsNoDataHero v-else-if="networkUsage.length === 0" type="card" />
    <VtsLinearChart v-else :data="networkUsage" :max-value :value-formatter="byteFormatter" />
  </UiCard>
</template>

<script lang="ts" setup>
import type { LinearChartData } from '@core/types/chart.ts'
import VtsErrorNoDataHero from '@core/components/state-hero/VtsErrorNoDataHero.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import VtsNoDataHero from '@core/components/state-hero/VtsNoDataHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import type { XapiVmStats } from '@vates/types/common'
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'

const { data } = defineProps<{
  data: XapiVmStats | null
  loading: boolean
  error?: string
}>()

const VtsLinearChart = defineAsyncComponent(() => import('@core/components/linear-chart/VtsLinearChart.vue'))

const { t } = useI18n()

const networkUsage = computed<LinearChartData>(() => {
  if (!data?.stats.vifs) {
    return []
  }

  const rxArrays = Object.values(data.stats.vifs.rx)

  const timestamps = Array.from(
    { length: rxArrays[0].length },
    (_, i) => data.endTimestamp * 1000 - (rxArrays[0].length - 1 - i) * data.interval * 1000
  )

  const rxSeries = [
    {
      label: t('network-download'),
      data: timestamps.map((timestamp, index) => ({
        timestamp,
        value: Object.values(data.stats.vifs?.rx ?? {}).reduce((sum, values) => sum + (values[index] ?? NaN), 0),
      })),
    },
  ]

  const txSeries = [
    {
      label: t('network-upload'),
      data: timestamps.map((timestamp, index) => ({
        timestamp,
        value: Object.values(data.stats.vifs?.tx ?? {}).reduce((sum, values) => sum + (values[index] ?? NaN), 0),
      })),
    },
  ]

  return [...txSeries, ...rxSeries]
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
