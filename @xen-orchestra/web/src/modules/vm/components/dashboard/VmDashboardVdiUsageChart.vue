<template>
  <UiCard :has-error="error">
    <UiCardTitle>
      {{ t('vdi-throughput') }}
      <template #description>{{ t('last-week') }}</template>
    </UiCardTitle>
    <VtsStateHero v-if="loading" format="card" type="busy" size="medium" />
    <VtsStateHero v-else-if="error" format="card" type="error" size="medium">
      {{ t('error-no-data') }}
    </VtsStateHero>
    <VtsStateHero v-else-if="vdiUsage.length === 0" format="card" type="no-data" size="medium">
      {{ t('no-data-to-calculate') }}
    </VtsStateHero>
    <VtsLinearChart v-else :data="vdiUsage" :max-value :value-formatter="byteFormatter" />
  </UiCard>
</template>

<script lang="ts" setup>
import type { LinearChartData } from '@core/types/chart.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import type { XapiVmStats } from '@vates/types/common'
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'

const { data } = defineProps<{
  data: XapiVmStats | null
  loading: boolean
  error?: boolean
}>()

const VtsLinearChart = defineAsyncComponent(() => import('@core/components/linear-chart/VtsLinearChart.vue'))

const { t } = useI18n()

const vdiUsage = computed<LinearChartData>(() => {
  if (!data?.stats.xvds) {
    return []
  }

  const readArrays = Object.values(data.stats.xvds.r ?? {})

  const timestamps = Array.from(
    { length: readArrays[0].length },
    (_, i) => data.endTimestamp * 1000 - (readArrays[0].length - 1 - i) * data.interval * 1000
  )

  const readSeries = [
    {
      label: t('read'),
      data: timestamps.map((timestamp, index) => ({
        timestamp,
        value: Object.values(data.stats.xvds?.r ?? {}).reduce((sum, values) => sum + (values[index] ?? NaN), 0),
      })),
    },
  ]

  const writeSeries = [
    {
      label: t('write'),
      data: timestamps.map((timestamp, index) => ({
        timestamp,
        value: Object.values(data.stats.xvds?.w ?? {}).reduce((sum, values) => sum + (values[index] ?? NaN), 0),
      })),
    },
  ]

  return [...readSeries, ...writeSeries]
})

const maxValue = computed(() => {
  const values = vdiUsage.value.reduce(
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
