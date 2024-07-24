<template>
  <div class="donut-chart-with-legend">
    <DonutChart :icon :segments />
    <LegendGroup :items="segments" :title />
  </div>
</template>

<script lang="ts" setup>
import DonutChart, { type DonutChartProps } from '@core/components/donut-chart/DonutChart.vue'
import LegendGroup, { type LegendGroupProps } from '@core/components/legend/LegendGroup.vue'

export type DonutChartWithLegendProps = {
  segments: (DonutChartProps['segments'][number] & LegendGroupProps['items'][number])[]
  title?: LegendGroupProps['title']
  icon?: DonutChartProps['icon']
}

defineProps<DonutChartWithLegendProps>()

defineSlots<{
  default: () => void
}>()
</script>

<style lang="postcss" scoped>
.donut-chart-with-legend {
  display: flex;
  align-items: center;
  gap: 3.2rem;
}
</style>
