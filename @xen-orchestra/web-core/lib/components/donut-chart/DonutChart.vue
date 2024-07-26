<!-- v1.1 -->
<template>
  <svg class="donut-chart" viewBox="0 0 100 100">
    <circle class="segment" cx="50" cy="50" r="40" />
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
    <UiIcon :icon height="24" width="24" x="38" y="38" />
  </svg>
</template>

<script lang="ts" setup>
import UiIcon from '@core/components/icon/UiIcon.vue'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { computed } from 'vue'

export type DonutSegmentColor = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'disabled'

export type DonutSegment = {
  value: number
  color: DonutSegmentColor
}

export type DonutChartProps = {
  segments: DonutSegment[]
  icon?: IconDefinition
}

const props = defineProps<DonutChartProps>()

const circumference = Math.PI * 80

const totalValue = computed(() => props.segments.reduce((total, segment) => total + segment.value, 0))

const computedSegments = computed(() => {
  let nextOffset = circumference / 4

  return props.segments.map(segment => {
    const offset = nextOffset
    const percent = (segment.value / totalValue.value) * circumference
    nextOffset -= percent

    return {
      color: segment.color,
      percent,
      offset,
    }
  })
})
</script>

<style lang="postcss" scoped>
.donut-chart {
  width: 100px;
  height: 100px;
}

.segment {
  stroke: var(--stroke-color);
  stroke-width: 10;
  fill: transparent;
  --stroke-color: var(--color-grey-100);

  &.primary {
    --stroke-color: var(--color-purple-base);
  }

  &.secondary {
    --stroke-color: var(--color-grey-100);
  }

  &.success {
    --stroke-color: var(--color-green-base);
  }

  &.warning {
    --stroke-color: var(--color-orange-base);
  }

  &.danger {
    --stroke-color: var(--color-red-base);
  }

  &.disabled {
    --stroke-color: var(--color-grey-400);
  }
}
</style>
