<template>
  <UiCard>
    <UiCardTitle>
      {{ $t('vdi-throughput') }}
      <template #description>{{ $t('last-week') }}</template>
    </UiCardTitle>
    <VtsLoadingHero v-if="loading" type="card" />
    <VtsErrorNoDataHero v-else-if="error" type="card" />
    <VtsNoDataHero v-else-if="vdiUsage.length === 0" type="card" />
    <VtsLinearChart v-else :data="vdiUsage" :max-value :value-formatter="byteFormatter" />
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

const vdiUsage = computed<LinearChartData>(() => {
  const { stats, timestampStart } = data

  const { xvds } = stats ?? {}

  if (xvds === undefined) {
    return []
  }

  const addVdiData = (type: 'r' | 'w') => ({
    label: type === 'r' ? t('vdi-read') : t('vdi-write'),

    data: Object.values(xvds[type])[0].map((_, index) => ({
      timestamp:
        (timestampStart -
          RRD_STEP_FROM_STRING.hours * (Object.values(xvds[type])[0].length - 1) +
          index * RRD_STEP_FROM_STRING.hours) *
        1000,
      value: Object.values(xvds[type]).reduce((sum, values) => sum + values[index], 0),
    })),
  })

  return [addVdiData('r'), addVdiData('w')]
})

const maxValue = computed(() => {
  const values = vdiUsage.value.reduce(
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
