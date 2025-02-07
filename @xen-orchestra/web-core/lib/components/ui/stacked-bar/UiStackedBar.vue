<!-- v2 -->
<template>
  <div class="ui-stacked-bar">
    <StackedBarSegment
      v-for="(segment, index) in parsedSegments"
      :key="index"
      :accent="segment.accent"
      :percentage="max === 0 ? 0 : (segment.value / max) * 100"
    />
  </div>
</template>

<script lang="ts" setup>
import StackedBarSegment, { type StackedBarSegmentProps } from '@core/components/ui/stacked-bar/StackedBarSegment.vue'
import { formatSizeParse } from '@core/utils/size.util'
import { computed } from 'vue'

type Segment = {
  value: number
  accent: StackedBarSegmentProps['accent']
  unit?: string
}

export type StackedBarProps = {
  segments: Segment[]
  maxValue?: {
    value?: number
    unit?: string
  }
}

const props = defineProps<StackedBarProps>()

const totalValue = computed(() =>
  props.segments.reduce((acc, segment) => acc + (formatSizeParse(segment.value, segment.unit) ?? 0), 0)
)

const max = computed(() =>
  Math.max(formatSizeParse(props.maxValue?.value, props.maxValue?.unit) ?? 0, totalValue.value)
)

const parsedSegments = computed(() =>
  props.segments.map(segment => ({ ...segment, value: formatSizeParse(segment.value, segment.unit) ?? 0 }))
)
</script>

<style lang="postcss" scoped>
.ui-stacked-bar {
  width: 100%;
  display: flex;
  height: 4rem;
  border-radius: 0.8rem;
  overflow: hidden;
  background-color: var(--color-neutral-background-disabled);
}
</style>
