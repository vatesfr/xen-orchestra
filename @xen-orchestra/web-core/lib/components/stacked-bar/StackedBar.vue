<!-- v1.0 -->
<template>
  <div class="stacked-bar">
    <StackedBarSegment
      v-for="(segment, index) in segments"
      :key="index"
      :color="segment.color"
      :percentage="max === 0 ? 0 : (segment.value / max) * 100"
    />
  </div>
</template>

<script lang="ts" setup>
import StackedBarSegment, { type StackedBarSegmentProps } from '@core/components/stacked-bar/StackedBarSegment.vue'
import { computed } from 'vue'

type Segment = {
  value: number
  color: StackedBarSegmentProps['color']
}

export type StackedBarProps = {
  segments: Segment[]
  maxValue?: number
}

const props = defineProps<StackedBarProps>()

const totalValue = computed(() => props.segments.reduce((acc, segment) => acc + segment.value, 0))

const max = computed(() => Math.max(props.maxValue ?? 0, totalValue.value))
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
