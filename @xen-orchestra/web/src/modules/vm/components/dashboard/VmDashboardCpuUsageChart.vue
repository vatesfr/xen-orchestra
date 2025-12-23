<template>
  <UiCard :has-error="error">
    <UiCardTitle>
      {{ t('cpu-usage') }}
      <template #description>{{ t('last-week') }}</template>
    </UiCardTitle>
    <VtsStateHero v-if="loading" format="card" type="busy" size="medium" />
    <VtsStateHero v-else-if="error" format="card" type="error" size="medium">
      {{ t('error-no-data') }}
    </VtsStateHero>
    <VtsStateHero v-else-if="cpuUsage.length === 0" format="card" type="no-data" size="medium">
      {{ t('no-data-to-calculate') }}
    </VtsStateHero>
    <VtsLinearChart v-else :data="cpuUsage" :max-value :value-formatter />
  </UiCard>
</template>

<script lang="ts" setup>
import type { LinearChartData, ValueFormatter } from '@core/types/chart.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import type { XapiVmStats } from '@vates/types/common'
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'

const { data } = defineProps<{
  data: XapiVmStats | null
  loading: boolean
  error?: boolean
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

    const cpuUsageSum = cpus.reduce((total, cpu) => total + (cpu[hourIndex] ?? NaN), 0)

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
  const values = cpuUsage.value[0]?.data.map(item => item.value || 0) ?? []

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
