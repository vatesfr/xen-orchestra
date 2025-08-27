<template>
  <UiCard :class="{ 'card-error': error }">
    <UiCardTitle>
      {{ t('pool-cpu-usage') }}
      <template #description>{{ t('last-week') }}</template>
    </UiCardTitle>
    <VtsStateHero v-if="loading || data === null" format="card" busy />
    <VtsStateHero v-else-if="error" format="card" type="error" image-size="medium">
      {{ t('error-no-data') }}
    </VtsStateHero>
    <VtsStateHero v-else-if="cpuUsage.length === 0" format="card" type="no-data" image-size="medium">
      {{ t('no-data-to-calculate') }}
    </VtsStateHero>
    <VtsLinearChart v-else :data="cpuUsage" :max-value="maxValue" :value-formatter="valueFormatter" class="chart" />
  </UiCard>
</template>

<script lang="ts" setup>
import type { LinearChartData, ValueFormatter } from '@core/types/chart.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import type { XapiHostStats, XapiPoolStats } from '@vates/types/common'
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'

const { data, loading, error } = defineProps<{
  data: XapiPoolStats | null
  loading: boolean
  error?: string
}>()

const VtsLinearChart = defineAsyncComponent(() => import('@core/components/linear-chart/VtsLinearChart.vue'))
const { t, n } = useI18n()

const cpuUsage = computed<LinearChartData>(() => {
  if (!data) {
    return []
  }

  const hostsStats = Object.values(data).filter((host): host is XapiHostStats => !!(host as XapiHostStats)?.stats?.cpus)
  if (hostsStats.length === 0) {
    return []
  }

  const result = new Map<number, { timestamp: number; value: number }>()
  const dataLength = hostsStats[0].stats.memory?.length ?? 0
  const timestampStart = hostsStats[0].endTimestamp - hostsStats[0].interval * (dataLength - 1)

  for (let hourIndex = 0; hourIndex < dataLength; hourIndex++) {
    const timestamp = (timestampStart + hourIndex * hostsStats[0].interval) * 1000

    const totalUsage = hostsStats.reduce((sumHost, host) => {
      const cpus = Object.values(host.stats.cpus ?? {})
      const cpuUsageSum = cpus.reduce((total, cpu) => total + (cpu[hourIndex] ?? NaN), 0)
      return sumHost + Math.round(cpuUsageSum)
    }, 0)

    result.set(timestamp, {
      timestamp,
      value: totalUsage,
    })
  }

  return [
    {
      label: t('stacked-cpu-usage'),
      data: Array.from(result.values()),
    },
  ]
})

const maxValue = computed(() => {
  if (!data) {
    return 100
  }

  const values = cpuUsage.value[0]?.data.map(item => item.value || 0) ?? []

  if (values.length === 0) {
    return 100
  }

  const maxCpuUsage = Math.max(...values) * 1.2

  return Math.ceil(maxCpuUsage / 100) * 100
})

const valueFormatter: ValueFormatter = value => {
  if (value === null) {
    return ''
  }

  return n(value / 100, 'percent')
}
</script>

<style scoped lang="postcss">
.card-error {
  background-color: var(--color-danger-background-selected);
}
</style>
