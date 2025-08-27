<template>
  <UiCard :class="{ 'card-error': error }">
    <UiCardTitle>
      {{ t('load-average') }}
      <template #description>{{ t('last-week') }}</template>
    </UiCardTitle>
    <VtsStateHero v-if="loading || data === null" format="card" busy />
    <VtsStateHero v-else-if="error" format="card" type="error">{{ t('error-no-data') }}</VtsStateHero>
    <VtsStateHero v-else-if="loadAverage.length === 0" format="card" type="no-data" image-size="medium">
      {{ t('no-data-to-calculate') }}
    </VtsStateHero>
    <VtsLinearChart v-else :data="loadAverage" :max-value />
  </UiCard>
</template>

<script lang="ts" setup>
import type { LinearChartData } from '@core/types/chart.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import type { XapiHostStats } from '@vates/types/common'
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'

const { data } = defineProps<{
  data: XapiHostStats | null
  loading: boolean
  error?: string
}>()

const VtsLinearChart = defineAsyncComponent(() => import('@core/components/linear-chart/VtsLinearChart.vue'))

const { t } = useI18n()

const loadAverage = computed<LinearChartData>(() => {
  if (!data?.stats.load) {
    return []
  }

  const loadValues = data.stats.load
  const result = new Map<number, { timestamp: number; value: number }>()
  const timestampStart = data.endTimestamp - data.interval * (loadValues.length - 1)

  for (let hourIndex = 0; hourIndex < loadValues.length; hourIndex++) {
    const timestamp = (timestampStart + hourIndex * data.interval) * 1000
    const load = loadValues[hourIndex]

    result.set(timestamp, {
      timestamp,
      value: Number(load?.toFixed(2)),
    })
  }

  return [
    {
      label: t('load-average'),
      data: Array.from(result.values()),
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

<style scoped lang="postcss">
.card-error {
  background-color: var(--color-danger-background-selected);
}
</style>
