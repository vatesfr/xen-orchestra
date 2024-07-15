<template>
  <div class="donut-with-legends">
    <DonutChart :segments="donutSegments" :icon :max-value="maxValue" />
    <div class="legends-and-title">
      <slot />
      <ul class="legends">
        <UiLegend
          v-for="(legendSegment, index) in legendSegments"
          :key="index"
          :color="legendSegment.color"
          :value="legendSegment.value"
          :unit="legendSegment.unit"
          :tooltip="legendSegment.tooltip"
        >
          {{ legendSegment.label }}
        </UiLegend>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import DonutChart from '@core/components/DonutChart.vue'
import UiLegend from '@core/components/UiLegend.vue'
import type { DonutSegmentColor } from '@core/types/donut-chart.type'
import type { LegendColor } from '@core/types/legend.type'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { computed } from 'vue'
const props = defineProps<{
  segments: {
    label: string
    value: number
    unit?: string
    color: DonutSegmentColor
    tooltip?: string
  }[]
  icon?: IconDefinition
  maxValue?: number
}>()
defineSlots<{
  default: () => void
}>()
const donutSegments = computed(() =>
  props.segments.map(segment => ({
    value: segment.value,
    color: segment.color,
  }))
)
const legendSegments = computed(() =>
  props.segments.map(segment => ({
    label: segment.label,
    value: segment.value,
    unit: segment.unit,
    color: segment.color === 'unknown' ? 'disabled' : (segment.color as LegendColor),
    tooltip: segment.tooltip,
  }))
)
</script>

<style lang="postcss" scoped>
.donut-with-legends {
  display: flex;
  align-items: center;
  gap: 3.2rem;
}
.legends-and-title {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
.legends {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
</style>
