<template>
  <UiCard>
    <UiCardTitle>
      {{ t('ram-usage') }}
      <template #description>{{ t('last-week') }}</template>
    </UiCardTitle>
    <VtsLoadingHero v-if="loading || data.stats === undefined" type="card" />
    <VtsErrorNoDataHero v-else-if="error" type="card" />
    <VtsLinearChart v-else :data="memoryUsage" :max-value :value-formatter="byteFormatter" />
  </UiCard>
</template>

<script lang="ts" setup>
import { type HostStats, RRD_STEP_FROM_STRING } from '@/libs/xapi-stats.ts'
import type { LinearChartData } from '@core/types/chart.ts'
import VtsErrorNoDataHero from '@core/components/state-hero/VtsErrorNoDataHero.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'

const { data } = defineProps<{
  data: {
    stats: HostStats | undefined
    timestampStart: number
  }
  loading: boolean
  error?: string
}>()

const VtsLinearChart = defineAsyncComponent(() => import('@core/components/linear-chart/VtsLinearChart.vue'))

const { t } = useI18n()

const memoryUsage = computed<LinearChartData>(() => {
  const { stats, timestampStart } = data
  const { memory: memoryTotal, memoryFree } = stats ?? {}

  if (memoryTotal === undefined || memoryFree === undefined) {
    return []
  }

  const result = memoryTotal.map((total, index) => ({
    timestamp:
      (timestampStart - RRD_STEP_FROM_STRING.hours * (memoryTotal.length - 1) + index * RRD_STEP_FROM_STRING.hours) *
      1000,
    value: total - memoryFree[index],
  }))

  return [
    {
      label: t('ram-usage'),
      data: result,
    },
  ]
})

const maxValue = computed(() => {
  if (!data.stats?.memory?.length) {
    return 1024 * 1024 * 1024 // 1 GB as fallback
  }

  return Math.max(...data.stats.memory, 0)
})

const byteFormatter = (value: number | null) => {
  if (value === null) {
    return ''
  }

  const result = formatSizeRaw(value, 1)

  return `${result?.value}${result?.prefix}`
}
</script>
