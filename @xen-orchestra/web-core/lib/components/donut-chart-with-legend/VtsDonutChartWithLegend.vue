<template>
  <div class="vts-donut-chart-with-legend">
    <UiDonutChart :icon :segments />
    <VtsLegendGroup :items="segments" :title />
  </div>
</template>

<script lang="ts" setup>
import VtsLegendGroup, { type LegendGroupProps } from '@core/components/legend-group/VtsLegendGroup.vue'
import UiDonutChart, { type DonutChartProps } from '@core/components/ui/donut-chart/UiDonutChart.vue'

export type DonutChartWithLegendProps = {
  segments: (DonutChartProps['segments'][number] & LegendGroupProps['items'][number])[]
  title?: LegendGroupProps['title']
  icon?: DonutChartProps['icon']
}

defineProps<DonutChartWithLegendProps>()
</script>

<style lang="postcss" scoped>
.vts-donut-chart-with-legend {
  display: flex;
  align-items: center;
  gap: 3.2rem;
}
</style>
