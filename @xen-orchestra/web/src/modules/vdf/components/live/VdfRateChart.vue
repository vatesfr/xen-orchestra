<template>
  <div class="vdf-rate-chart">
    <VtsLinearChart :data :max-value :value-formatter :time-formatter :time-min-interval="60_000" class="chart" />
  </div>
</template>

<script lang="ts" setup>
import { niceMax, type VdfRateSeries } from '@/modules/vdf/utils/vdf-rate-series.util.ts'
import type { LinearChartData } from '@core/types/chart.ts'
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'

// Allowed and dropped connections over time (vdf#59), in XO's own chart:
// allowed first (the theme's brand color), dropped second (its warning
// color), a y-axis sized to the data, local times
const { series, unit } = defineProps<{
  series: VdfRateSeries
  // per second (Live's rates) or per minute (counts from the rule log)
  unit: 'second' | 'minute'
}>()

const VtsLinearChart = defineAsyncComponent(() => import('@core/components/linear-chart/VtsLinearChart.vue'))

const { t, n, locale } = useI18n()

const data = computed<LinearChartData>(() => [
  { label: t('firewall:chart:allowed'), data: series.allowed },
  { label: t('firewall:chart:dropped'), data: series.dropped },
])

const maxValue = computed(() => niceMax(series))

const valueFormatter = (value: number | null) =>
  value === null ? '' : t(`firewall:chart:per-${unit}`, { n: n(value, { maximumFractionDigits: value < 10 ? 1 : 0 }) })

// short labels (hours and minutes, as the tables beside them write time in
// the user's locale): the window is minutes
const timeFormatter = computed(() => {
  const format = new Intl.DateTimeFormat(locale.value, { hour: '2-digit', minute: '2-digit' })

  return (timestamp: number) => format.format(timestamp)
})
</script>

<style lang="postcss" scoped>
.vdf-rate-chart {
  .chart {
    height: 22rem;
  }
}
</style>
