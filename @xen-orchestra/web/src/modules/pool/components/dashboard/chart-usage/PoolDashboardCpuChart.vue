<template>
  <UiCard :has-error="error">
    <UiCardTitle>
      {{ t('pool-cpu-usage') }}
      <template #description>{{ t('last-week') }}</template>
    </UiCardTitle>
    <VtsStateHero v-if="loading || data === null" format="card" type="busy" size="medium" />
    <VtsStateHero v-else-if="error" format="card" type="error" size="medium">
      {{ t('error-no-data') }}
    </VtsStateHero>
    <VtsStateHero v-else-if="cpuUsage.length === 0" format="card" type="no-data" size="medium">
      {{ t('no-data-to-calculate') }}
    </VtsStateHero>
    <VtsLinearChart v-else :data="cpuUsage" :max-value="maxValue" :value-formatter="valueFormatter" class="chart" />
  </UiCard>
</template>

<script lang="ts" setup>
import { buildStackedTimeSeries, getHostsStats } from '@/modules/pool/utils/xo-pool-dashboard.util.ts'
import { roundUpChartMax } from '@/shared/utils/chart-stats.util.ts'
import type { LinearChartData, ValueFormatter } from '@core/types/chart.ts'
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
const { t, n } = useI18n()

const cpuUsage = computed<LinearChartData>(() => {
  if (!data) {
    return []
  }

  const hostsStats = getHostsStats(data, host => !!host.stats?.cpus)
  if (hostsStats.length === 0) {
    return []
  }

  const dataLength = hostsStats[0].stats.memory?.length ?? 0

  const cpuUsageSeries = buildStackedTimeSeries(hostsStats, dataLength, (host, index) => {
    const cpus = Object.values(host.stats.cpus ?? {})
    const cpuUsageSum = cpus.reduce((total, cpu) => total + (cpu[index] ?? NaN), 0)

    return Math.round(cpuUsageSum)
  })

  return [
    {
      label: t('stacked-cpu-usage'),
      data: cpuUsageSeries,
    },
  ]
})

const maxValue = computed(() => {
  const values = cpuUsage.value[0]?.data.map(item => item.value || 0) ?? []

  return roundUpChartMax(values, { step: 100, fallback: 100, headroom: 1.2 })
})

const valueFormatter: ValueFormatter = value => {
  if (value === null) {
    return ''
  }

  return n(value / 100, 'percent')
}
</script>
