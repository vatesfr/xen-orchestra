<!-- v3 -->
<template>
  <svg class="ui-donut-chart" viewBox="0 0 100 100">
    <circle class="segment" cx="50" cy="50" r="40" />
    <circle
      v-for="(segment, index) in computedSegments"
      :key="index"
      :class="`accent--${segment.accent}`"
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

export type DonutSegmentAccent = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'muted'

export type DonutSegment = {
  value: number
  accent: DonutSegmentAccent
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

  const segments = props.segments.map(segment => {
    const percent = totalValue.value === 0 ? 0 : (segment.value / totalValue.value) * circumference
    const offset = nextOffset
    nextOffset -= percent

    return {
      accent: segment.accent,
      percent,
      offset,
    }
  })

  if (segments.every(segment => segment.percent === 0)) {
    return [
      {
        accent: 'muted',
        percent: circumference,
        offset: nextOffset,
      },
    ]
  }
  return segments
})
</script>

<style lang="postcss" scoped>
.ui-donut-chart {
  width: 100px;
  height: 100px;

  .segment {
    stroke-width: 10;
    fill: transparent;

    &.accent--neutral {
      stroke: var(--color-neutral-txt-primary);
    }

    &.accent--info {
      stroke: var(--color-info-item-base);
    }

    &.accent--success {
      stroke: var(--color-success-item-base);
    }

    &.accent--warning {
      stroke: var(--color-warning-item-base);
    }

    &.accent--danger {
      stroke: var(--color-danger-item-base);
    }

    &.accent--muted {
      stroke: var(--color-neutral-background-disabled);
    }
  }
}
</style>
