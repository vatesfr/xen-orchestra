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
    <VtsIcon :icon accent="current" height="24" width="24" x="38" y="38" />
  </svg>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
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
  --stroke-color: var(--color-neutral-txt-primary);

  &.primary {
    --stroke-color: var(--color-normal-item-base);
  }

  &.secondary {
    --stroke-color: var(--color-neutral-txt-primary);
  }

  &.success {
    --stroke-color: var(--color-success-item-base);
  }

  &.warning {
    --stroke-color: var(--color-warning-item-base);
  }

  &.danger {
    --stroke-color: var(--color-danger-item-base);
  }

  &.disabled {
    --stroke-color: var(--color-neutral-background-disabled);
  }
}
</style>
