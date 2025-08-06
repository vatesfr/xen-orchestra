<template>
  <UiCard>
    <UiCardTitle>
      {{ t('network-throughput') }}
      <template #description>{{ t('last-week') }}</template>
    </UiCardTitle>
    <VtsLoadingHero v-if="loading || data === null" type="card" />
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
import type { XapiHostStats, XapiPoolStats } from '@vates/types/common'
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'

const { data, loading, error } = defineProps<{
  data: XapiPoolStats | null
  loading: boolean
  error?: string
}>()

const VtsLinearChart = defineAsyncComponent(() => import('@core/components/linear-chart/VtsLinearChart.vue'))

const { t } = useI18n()

const networkUsage = computed<LinearChartData>(() => {
  if (!data) {
    return []
  }

  const hostsStats = Object.values(data).filter(
    (hostStats): hostStats is XapiHostStats => !!(hostStats as XapiHostStats)?.stats?.pifs
  )
  if (hostsStats.length === 0) {
    return []
  }

  const timestamps = Array.from(
    { length: Object.values(hostsStats[0]?.stats?.pifs?.rx ?? {})[0].length },
    (_, i) =>
      hostsStats[0].endTimestamp * 1000 -
      (Object.values(hostsStats[0]?.stats?.pifs?.rx ?? {})[0].length - 1 - i) * hostsStats[0].interval * 1000
  )

  const txSeries = [
    {
      label: t('network-upload'),
      data: timestamps.map((timestamp, index) => {
        const hostsSum = hostsStats.reduce((total, host) => {
          const value = Object.values(host.stats?.pifs?.tx ?? {}).reduce(
            (sum, values) => sum + (values[index] ?? NaN),
            0
          )
          return total + value
        }, 0)
        return { timestamp, value: hostsSum }
      }),
    },
  ]

  const rxSeries = [
    {
      label: t('network-download'),
      data: timestamps.map((timestamp, index) => {
        const hostsSum = hostsStats.reduce((total, host) => {
          const value = Object.values(host.stats?.pifs?.rx ?? {}).reduce(
            (sum, values) => sum + (values[index] ?? NaN),
            0
          )
          return total + value
        }, 0)
        return { timestamp, value: hostsSum }
      }),
    },
  ]

  return [...txSeries, ...rxSeries]
})

const maxValue = computed(() => {
  const values = networkUsage.value.flatMap(series => series.data.map(item => item.value || 0))

  if (values.length === 0) {
    return 100
  }

  const maxUsage = Math.max(...values) * 1.2

  return Math.ceil(maxUsage / 50) * 50
})

const byteFormatter = (value: number | null) => {
  if (value === null) {
    return ''
  }

  const size = formatSizeRaw(value, 1)

  return `${size.value} ${size.prefix}`
}
</script>
