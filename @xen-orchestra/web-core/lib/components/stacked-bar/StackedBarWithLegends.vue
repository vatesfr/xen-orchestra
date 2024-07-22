<template>
  <div class="stacked-bar-with-legends">
    <StackedBar :segments="stackedBarSegments" :max-value />
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
import StackedBar from '@core/components/stacked-bar/StackedBar.vue'
import UiLegend from '@core/components/UiLegend.vue'
import type { LegendColor } from '@core/types/legend.type'
import { computed } from 'vue'

const props = defineProps<{
  segments: {
    label: string
    value: number
    unit?: string
    color: LegendColor
    tooltip?: string
  }[]
  maxValue?: number
}>()

const stackedBarSegments = computed(() => {
  return props.segments.map(segment => ({
    value: segment.value,
    color: segment.color === 'default' ? 'info' : segment.color,
  }))
})
</script>

<style scoped lang="scss">
.stacked-bar-with-legends {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.legends {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  align-items: end;

  @media (--desktop) {
    flex-direction: row;
    justify-content: end;
    gap: 4rem;
  }
}
</style>
