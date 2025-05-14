<template>
  <UiCard>
    <UiCardTitle>
      {{ $t('disk-throughput') }}
      <template #description>{{ $t('last-week') }}</template>
    </UiCardTitle>
    <VtsErrorNoDataHero v-if="error" type="card" />
    <VtsLoadingHero v-else-if="loading || data.stats === undefined" type="card" />
    <VtsNoDataHero v-else-if="diskUsage.length === 0" type="card" />
    <VtsLinearChart v-else :data="diskUsage" :max-value :value-formatter="byteFormatter" />
  </UiCard>
</template>

<script lang="ts" setup>
import { RRD_STEP_FROM_STRING, type VmStats } from '@/libs/xapi-stats.ts'
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
  data: {
    stats: VmStats | undefined
    timestampStart: number
  }

  loading: boolean
  error?: string
}>()

const VtsLinearChart = defineAsyncComponent(() => import('@core/components/linear-chart/VtsLinearChart.vue'))

const { t } = useI18n()

const diskUsage = computed<LinearChartData>(() => {
  const { stats, timestampStart } = data

  const { xvds } = stats ?? {}

  if (xvds === undefined) {
    return []
  }

  const addDiskData = (type: 'r' | 'w') => ({
    label: type === 'r' ? t('disk-read') : t('disk-write'),

    data: Object.values(xvds[type])[0].map((_, index) => ({
      timestamp:
        (timestampStart -
          RRD_STEP_FROM_STRING.hours * (Object.values(xvds[type])[0].length - 1) +
          index * RRD_STEP_FROM_STRING.hours) *
        1000,
      value: Object.values(xvds[type]).reduce((sum, values) => sum + values[index], 0),
    })),
  })

  return [addDiskData('r'), addDiskData('w')]
})

const maxValue = computed(() => {
  const values = diskUsage.value.reduce(
    (acc, series) => [...acc, ...series.data.map(item => item.value)],
    [] as number[]
  )

  if (values.length === 0) {
    return 100
  }

  const maxUsage = Math.max(...values)

  return Math.ceil(maxUsage / 100) * 100
})
const byteFormatter = (value: number) => {
  const result = formatSizeRaw(value, 1)

  return `${result?.value}${result?.prefix}`
}
</script>
