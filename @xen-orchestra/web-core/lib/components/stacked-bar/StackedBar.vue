<!-- v1.0 -->
<template>
  <div class="stacked-bar">
    <StackedBarSegment
      v-for="(segment, index) in computedSegments"
      :key="index"
      :color="segment.color"
      :percentage="segment.percentage"
    />
  </div>
</template>

<script lang="ts" setup>
import StackedBarSegment from '@core/components/stacked-bar/StackedBarSegment.vue'
import type { Color } from '@core/types/color.type'
import { computed } from 'vue'

type Segment = {
  value: number
  color: Color
}

const props = defineProps<{
  segments: Segment[]
  maxValue?: number
}>()

const totalValue = computed(() => props.segments.reduce((acc, bar) => acc + bar.value, 0))

const max = computed(() => Math.max(props.maxValue ?? 0, totalValue.value))

const computedSegments = computed(() => {
  return props.segments.map(segment => ({
    ...segment,
    percentage: (segment.value / max.value) * 100,
  }))
})
</script>

<style lang="postcss" scoped>
.stacked-bar {
  width: 100%;
  display: flex;
  height: 4rem;
  border-radius: 0.8rem;
  overflow: hidden;
  background-color: var(--background-color-purple-10);
}
</style>
