<!-- v1.1 -->
<template>
  <svg class="donut-chart" viewBox="0 0 100 100">
    <circle
      class="segment"
      cx="50"
      cy="50"
      r="40"
    />
    <circle
      v-for="(segment, index) in computedSegments"
      :key="index"
      :class="segment.color"
      :stroke-dasharray="`${segment.percent} ${circumference - segment.percent}`"
      :stroke-dashoffset="segment.offset"
      class="segment"
      cx="50"
      cy="50"
      r="40"
    />
    <UiIcon
      :icon
      height="24"
      width="24"
      x="38"
      y="38"
    />
  </svg>
</template>

<script setup lang="ts">
import UiIcon from '@core/components/icon/UiIcon.vue'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { computed } from 'vue'

type Segment = {
  value: number
  color: 'success' | 'warning' | 'error' | 'unknown'
}

type ComputedSegment = {
  color: 'success' | 'warning' | 'error' | 'unknown'
  percent: number
  offset: number
}

const props = defineProps<{
  segments: Segment[]
  maxValue?: number
  icon?: IconDefinition
}>()

const circumference = Math.PI * 80

const totalValue = computed(() => {
  const sumOfValues = props.segments.reduce((acc, segment) => acc + segment.value, 0)
  return Math.max(props.maxValue ?? 0, sumOfValues)
})

const computedSegments = computed<ComputedSegment[]>(() => {
  let nextOffset = circumference / 4
  return props.segments.map(segment => {
    const percent = (segment.value / totalValue.value) * circumference
    const currentSegment = {
      color: segment.color,
      percent,
      offset: nextOffset,
    }
    nextOffset -= percent
    return currentSegment
  })
})
</script>

<style scoped lang="postcss">
.donut-chart {
  width: 100px;
  height: 100px;
}

.segment {
  stroke: var(--stroke-color);
  stroke-width: 10;
  fill: transparent;
  --stroke-color: var(--color-grey-100);

  &.success {
    --stroke-color: var(--color-green-base);
  }

  &.warning {
    --stroke-color: var(--color-orange-base);
  }

  &.error {
    --stroke-color: var(--color-red-base);
  }

  &.unknown {
    --stroke-color: var(--color-grey-400);
  }
}
</style>
