<template>
  <UiCard :has-error="error">
    <UiCardTitle>
      {{ t('load-average') }}
      <template #description>{{ t('last-week') }}</template>
    </UiCardTitle>
    <VtsStateHero v-if="loading || data.stats === undefined" format="card" type="busy" size="medium" />
    <VtsStateHero v-else-if="error" format="card" type="error" size="medium">
      {{ t('error-no-data') }}
    </VtsStateHero>
    <VtsStateHero v-else-if="loadAverage.length === 0" format="card" type="no-data" size="medium">
      {{ t('no-data-to-calculate') }}
    </VtsStateHero>
    <VtsLinearChart v-else :data="loadAverage" :max-value />
  </UiCard>
</template>

<script lang="ts" setup>
import { RRD_STEP_FROM_STRING } from '@/libs/xapi-stats.ts'
import type { LinearChartData } from '@core/types/chart.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import type { XapiHostStatsRaw } from '@vates/types/common'
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'

const { data } = defineProps<{
  data: {
    stats: XapiHostStatsRaw | undefined
    timestampStart: number
  }
  loading: boolean
  error?: boolean
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
    value: Number(value?.toFixed(2)),
  }))

  return [
    {
      label: t('load-average'),
      data: result,
    },
  ]
})

const maxValue = computed(() => {
  const values = loadAverage.value[0]?.data.map(item => item.value || 0) ?? []

  if (values.length === 0) {
    return 10
  }

  const maxLoad = Math.max(...values)

  return Math.ceil(maxLoad / 5) * 5
})
</script>
