<template>
  <UiCard>
    <UiCardTitle>
      {{ t('vdi-throughput') }}
      <template #description>{{ t('last-week') }}</template>
    </UiCardTitle>
    <VtsLoadingHero v-if="loading" type="card" />
    <VtsErrorNoDataHero v-else-if="error" type="card" />
    <VtsNoDataHero v-else-if="vdiUsage.length === 0" type="card" />
    <VtsLinearChart v-else :data="vdiUsage" :max-value :value-formatter="byteFormatter" />
  </UiCard>
</template>

<script lang="ts" setup>
import type { XoVmStats } from '@/types/xo/vm-stats.type.ts'
import type { LinearChartData } from '@core/types/chart.ts'
import VtsErrorNoDataHero from '@core/components/state-hero/VtsErrorNoDataHero.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import VtsNoDataHero from '@core/components/state-hero/VtsNoDataHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'

const { data } = defineProps<{
  data: XoVmStats | null
  loading: boolean
  error?: string
}>()

const VtsLinearChart = defineAsyncComponent(() => import('@core/components/linear-chart/VtsLinearChart.vue'))

const { t } = useI18n()

const vdiUsage = computed<LinearChartData>(() => {
  if (!data?.stats.xvds) {
    return []
  }

  const readArrays = Object.values(data.stats.xvds.r)

  const timestamps = Array.from(
    { length: readArrays[0].length },
    (_, i) => data.endTimestamp * 1000 - (readArrays[0].length - 1 - i) * data.interval * 1000
  )

  const readSeries = [
    {
      label: t('read'),
      data: timestamps.map((timestamp, index) => ({
        timestamp,
        value: Object.values(data.stats.xvds.r).reduce((sum, values) => sum + values[index], 0),
      })),
    },
  ]

  const writeSeries = [
    {
      label: t('write'),
      data: timestamps.map((timestamp, index) => ({
        timestamp,
        value: Object.values(data.stats.xvds.w).reduce((sum, values) => sum + values[index], 0),
      })),
    },
  ]

  return [...readSeries, ...writeSeries]
})

const maxValue = computed(() => {
  const values = vdiUsage.value.reduce(
    (acc, series) => [...acc, ...series.data.map(item => item.value ?? 0)],
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

  const result = formatSizeRaw(value, 1)

  return `${result?.value}${result?.prefix}`
}
</script>
