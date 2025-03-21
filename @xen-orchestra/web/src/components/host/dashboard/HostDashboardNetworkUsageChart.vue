<template>
  <UiCard>
    <UiCardTitle>{{ $t('network-throughput') }}</UiCardTitle>
    <VtsErrorNoDataHero v-if="error" type="card" />
    <VtsLoadingHero v-else :disabled="!loading && data !== null" type="card">
      <VtsLinearChart :data="networkUsage" :max-value :value-formatter="byteFormatter" />
    </VtsLoadingHero>
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

const networkUsage = computed<LinearChartData>(() => {
  if (!data?.stats?.pifs) {
    return []
  }

  const timestamps = Array.from(
    { length: data.stats.pifs.rx['0'].length },
    (_, i) => data.endTimestamp * 1000 - (data.stats.pifs.rx['0'].length - 1 - i) * data.interval * 1000
  )

  const rxSeries = [
    {
      label: t('network-upload'),
      data: timestamps.map((timestamp, index) => ({
        timestamp,
        value: Object.values(data.stats.pifs.rx).reduce((sum, values) => sum + values[index], 0),
      })),
    },
  ]

  const txSeries = [
    {
      label: t('network-download'),
      data: timestamps.map((timestamp, index) => ({
        timestamp,
        value: Object.values(data.stats.pifs.tx).reduce((sum, values) => sum + values[index], 0),
      })),
    },
  ]

  return [...rxSeries, ...txSeries]
})

const maxValue = computed(() => {
  const values = networkUsage.value.flatMap(series => series.data.map(item => item.value))
  if (values.length === 0) return 100

  const maxUsage = Math.max(...values)
  return Math.ceil(maxUsage / 50) * 50
})

const byteFormatter = (value: number) => {
  const result = formatSizeRaw(value, 1)

  return `${result?.value}${result?.prefix}`
}
</script>
