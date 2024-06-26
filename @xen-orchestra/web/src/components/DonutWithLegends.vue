<template>
  <div class="donut-with-legends">
    <DonutChart :segments="donutSegments" :icon="icon" :max-value="maxValue" />
    <ul class="legends">
      <UiLegend
        v-for="(segment, index) in segments"
        :key="index"
        :color="segment.color"
        :value="segment.value"
        :unit="segment.unit"
        :tooltip="segment.tooltip"
      >
        {{ segment.label }}
      </UiLegend>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { DonutSegment } from '@core/types/donut-chart.type'
import type { LegendColor } from '@core/types/ui-legend.type'
import DonutChart from '@core/components/DonutChart.vue'
import UiLegend from '@core/components/UiLegend.vue'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { computed } from 'vue'

const props = defineProps<{
  segments: {
    label: string
    value: number
    unit?: string
    color: LegendColor
    tooltip?: string
  }[]
  icon: IconDefinition
}>()

const maxValue = computed(() => {
  return props.segments.reduce((acc, segment) => {
    return acc + segment.value
  }, 0)
})

const donutSegments = computed(() => {
  if (props?.segments.length === 0) {
    return []
  }
  return props.segments
    .filter(segment => segment.color !== 'dark-blue')
    .map(segment => {
      let color
      if (segment.color === 'disabled' || segment.color === 'default') {
        color = 'unknown'
      } else {
        color = segment.color
      }

      return {
        value: segment.value,
        color,
      }
    }) as DonutSegment[]
})
</script>

<style lang="postcss" scoped>
.donut-with-legends {
  display: flex;
  align-items: center;
  gap: 3.2rem;
}
</style>
