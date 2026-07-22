<template>
  <UiCard :has-error="error">
    <UiCardTitle>
      {{ t('network-throughput') }}
      <template #description>{{ t('last-week') }}</template>
    </UiCardTitle>
    <VtsStateHero v-if="loading || data === null" format="card" type="busy" size="medium" />
    <VtsStateHero v-else-if="error" format="card" type="error" size="medium">
      {{ t('error-no-data') }}
    </VtsStateHero>
    <VtsStateHero v-else-if="networkUsage.length === 0" format="card" type="no-data" size="medium">
      {{ t('no-data-to-calculate') }}
    </VtsStateHero>
    <VtsLinearChart v-else :data="networkUsage" :max-value :value-formatter="formatChartBytes" />
  </UiCard>
</template>

<script lang="ts" setup>
import { buildStackedTimeSeries, getHostsStats } from '@/modules/pool/utils/xo-pool-dashboard.util.ts'
import { formatChartBytes, roundUpChartMax } from '@/shared/utils/chart-stats.util.ts'
import type { LinearChartData } from '@core/types/chart.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import type { XapiPoolStats } from '@vates/types/common'
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'

const { data, loading } = defineProps<{
  data: XapiPoolStats | null
  loading: boolean
  error?: boolean
}>()

const VtsLinearChart = defineAsyncComponent(() => import('@core/components/linear-chart/VtsLinearChart.vue'))

const { t } = useI18n()

const networkUsage = computed<LinearChartData>(() => {
  if (!data) {
    return []
  }

  const hostsStats = getHostsStats(data, host => !!host.stats?.pifs)
  if (hostsStats.length === 0) {
    return []
  }

  const dataLength = Object.values(hostsStats[0].stats.pifs?.rx ?? {})[0].length

  const txSeries = buildStackedTimeSeries(hostsStats, dataLength, (host, index) =>
    Object.values(host.stats.pifs?.tx ?? {}).reduce((sum, values) => sum + (values[index] ?? NaN), 0)
  )

  const rxSeries = buildStackedTimeSeries(hostsStats, dataLength, (host, index) =>
    Object.values(host.stats.pifs?.rx ?? {}).reduce((sum, values) => sum + (values[index] ?? NaN), 0)
  )

  return [
    {
      label: t('network-upload'),
      data: txSeries,
    },
    {
      label: t('network-download'),
      data: rxSeries,
    },
  ]
})

const maxValue = computed(() => {
  const values = networkUsage.value.flatMap(series => series.data.map(item => item.value || 0))

  return roundUpChartMax(values, { step: 50, fallback: 100, headroom: 1.2 })
})
</script>
