<template>
  <UiCard>
    <UiCardTitle>
      {{ $t('load-average') }}
      <template #description>{{ $t('last-week') }}</template>
    </UiCardTitle>
    <VtsLoadingHero v-if="loading || data.stats === undefined" type="card" />
    <VtsErrorNoDataHero v-else-if="error" type="card" />
    <VtsLinearChart v-else :data="loadAverage" :max-value />
  </UiCard>
</template>

<script lang="ts" setup>
import { type HostStats, RRD_STEP_FROM_STRING } from '@/libs/xapi-stats.ts'
import type { LinearChartData } from '@core/types/chart.ts'
import VtsErrorNoDataHero from '@core/components/state-hero/VtsErrorNoDataHero.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
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

const loadAverage = computed<LinearChartData>(() => {
  const { stats, timestampStart } = data
  const { load } = stats ?? {}

  if (!load?.length) {
    return []
  }

  const result = load.map((value, index) => ({
    timestamp: (timestampStart + index * RRD_STEP_FROM_STRING.hours) * 1000,
    value: Number(value.toFixed(2)),
  }))

  return [
    {
      label: t('load-average'),
      data: result,
    },
  ]
})

const maxValue = computed(() => {
  const values = loadAverage.value[0]?.data.map(item => item.value) ?? []

  if (values.length === 0) {
    return 10
  }

  const maxLoad = Math.max(...values)
  return Math.ceil(maxLoad / 5) * 5
})
</script>
