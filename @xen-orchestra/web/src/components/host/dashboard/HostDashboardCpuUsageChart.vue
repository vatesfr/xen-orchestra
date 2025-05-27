<template>
  <UiCard>
    <UiCardTitle>
      {{ t('cpu-usage') }}
      <template #description>{{ t('last-week') }}</template>
    </UiCardTitle>
    <VtsLoadingHero v-if="loading || data === null" type="card" />
    <VtsErrorNoDataHero v-else-if="error" type="card" />
    <VtsLinearChart v-else :data="cpuUsage" :max-value :value-formatter class="chart" />
  </UiCard>
</template>

<script lang="ts" setup>
import type { XoHostStats } from '@/types/xo/host-stats.type.ts'
import type { LinearChartData, ValueFormatter } from '@core/types/chart.ts'
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

const { t, n } = useI18n()

const cpuUsage = computed<LinearChartData>(() => {
  if (!data?.stats.cpus) {
    return []
  }

  const cpus = Object.values(data.stats.cpus)
  const result = new Map<number, { timestamp: number; value: number }>()
  const timestampStart = data.endTimestamp - data.interval * (cpus[0].length - 1)

  for (let hourIndex = 0; hourIndex < cpus[0].length; hourIndex++) {
    const timestamp = (timestampStart + hourIndex * data.interval) * 1000
    const cpuUsageSum = cpus.reduce((total, cpu) => total + cpu[hourIndex], 0)

    result.set(timestamp, {
      timestamp,
      value: Math.round(cpuUsageSum / cpus.length),
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
  const values = cpuUsage.value[0]?.data.map(item => item.value ?? 0) ?? []

  if (values.length === 0) {
    return 100
  }

  const maxCpuUsage = Math.max(...values)

  return Math.ceil(maxCpuUsage / 100) * 100
})

const valueFormatter: ValueFormatter = value => {
  if (value === null) {
    return ''
  }

  return n(value / 100, 'percent')
}
</script>
