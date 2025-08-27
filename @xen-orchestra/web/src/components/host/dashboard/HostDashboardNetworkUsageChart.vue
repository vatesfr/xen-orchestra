<template>
  <UiCard :class="{ 'card-error': error }">
    <UiCardTitle>
      {{ t('network-throughput') }}
      <template #description>{{ t('last-week') }}</template>
    </UiCardTitle>
    <VtsStateHero v-if="loading || data === null" format="card" busy />
    <VtsStateHero v-else-if="error" format="card" type="error">{{ t('error-no-data') }}</VtsStateHero>
    <VtsStateHero v-else-if="networkUsage.length === 0" format="card" type="no-data" image-size="medium">
      {{ t('no-data-to-calculate') }}
    </VtsStateHero>
    <VtsLinearChart v-else :data="networkUsage" :max-value :value-formatter="byteFormatter" />
  </UiCard>
</template>

<script lang="ts" setup>
import type { LinearChartData } from '@core/types/chart.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { formatSizeRaw } from '@core/utils/size.util.ts'
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

const networkUsage = computed<LinearChartData>(() => {
  if (!data?.stats?.pifs) {
    return []
  }

  const timestamps = Array.from(
    { length: data.stats.pifs.rx['0'].length },
    (_, i) => data.endTimestamp * 1000 - ((data.stats.pifs?.rx?.['0'].length ?? 0) - 1 - i) * data.interval * 1000
  )

  const rxSeries = [
    {
      label: t('network-upload'),
      data: timestamps.map((timestamp, index) => ({
        timestamp,
        value: Object.values(data.stats.pifs?.rx ?? {}).reduce((sum, values) => sum + (values[index] ?? NaN), 0),
      })),
    },
  ]

  const txSeries = [
    {
      label: t('network-upload'),
      data: timestamps.map((timestamp, index) => ({
        timestamp,
        value: Object.values(data.stats.pifs?.tx ?? {}).reduce((sum, values) => sum + (values[index] ?? NaN), 0),
      })),
    },
  ]

  return [...txSeries, ...rxSeries]
})

const maxValue = computed(() => {
  const values = networkUsage.value.flatMap(series => series.data.map(item => item.value || 0))

  if (values.length === 0) {
    return 100
  }

  const maxUsage = Math.max(...values) * 1.2

  return Math.ceil(maxUsage / 50) * 50
})

const byteFormatter = (value: number | null) => {
  if (value === null) {
    return ''
  }

  const size = formatSizeRaw(value, 1)

  return `${size.value} ${size.prefix}`
}
</script>

<style scoped lang="postcss">
.card-error {
  background-color: var(--color-danger-background-selected);
}
</style>
