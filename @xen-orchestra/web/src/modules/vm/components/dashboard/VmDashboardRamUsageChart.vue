<template>
  <UiCard :has-error="error">
    <UiCardTitle>
      {{ t('ram-usage') }}
      <template #description>{{ t('last-week') }}</template>
    </UiCardTitle>
    <VtsStateHero v-if="loading" format="card" type="busy" size="medium" />
    <VtsStateHero v-else-if="error" format="card" type="error" size="medium">
      {{ t('error-no-data') }}
    </VtsStateHero>
    <VtsStateHero v-else-if="ramUsage.length === 0" format="card" type="no-data" size="medium">
      {{ t('no-data-to-calculate') }}
    </VtsStateHero>
    <VtsLinearChart v-else :data="ramUsage" :max-value :value-formatter="byteFormatter" />
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

const ramUsage = computed<LinearChartData>(() => {
  if (!data?.stats.memory || !data?.stats.memoryFree) {
    return []
  }

  const ramTotalValues = data.stats.memory

  const ramFreeValues = data.stats.memoryFree

  const result = new Map<number, { timestamp: number; value: number }>()

  const timestampStart = data.endTimestamp - data.interval * (ramTotalValues.length - 1)

  for (let hourIndex = 0; hourIndex < ramTotalValues.length; hourIndex++) {
    const timestamp = (timestampStart + hourIndex * data.interval) * 1000

    const ramTotal = ramTotalValues[hourIndex]

    const ramFree = ramFreeValues[hourIndex]

    const ramUsed = (ramTotal ?? NaN) - (ramFree ?? NaN)

    result.set(timestamp, {
      timestamp,
      value: ramUsed,
    })
  }
  return [
    {
      label: t('stacked-ram-usage'),
      data: Array.from(result.values()),
    },
  ]
})

const maxValue = computed(() => {
  if (!data?.stats.memory?.length) {
    return 1024 * 1024 * 1024 // 1 GB as fallback
  }

  return Math.max(...data.stats.memory.map(memoryValue => memoryValue || 0), 0)
})

const byteFormatter = (value: number | null) => {
  if (value === null) {
    return ''
  }

  const size = formatSizeRaw(value, 1)

  return `${size.value} ${size.prefix}`
}
</script>
