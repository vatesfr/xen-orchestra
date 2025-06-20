<!-- v3 -->
<template>
  <div class="ui-donut-chart">
    <VtsIcon v-if="icon" :name="icon" size="medium" class="chart-icon" />
    <svg viewBox="0 0 100 100">
      <circle class="segment accent--muted" cx="50" cy="50" r="40" />
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
    </svg>
  </div>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import type { IconName } from '@core/icons'
import { computed } from 'vue'

export type DonutSegmentAccent = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'muted'

export type DonutSegment = {
  value: number
  accent: DonutSegmentAccent
}

export type DonutChartProps = {
  segments: DonutSegment[]
  icon?: IconName
}

const props = defineProps<DonutChartProps>()

const circumference = Math.PI * 80

const totalValue = computed(() => props.segments.reduce((total, segment) => total + segment.value, 0))

const computedSegments = computed(() => {
  let nextOffset = circumference / 4

  return props.segments.map(segment => {
    const percent = totalValue.value === 0 ? 0 : (segment.value / totalValue.value) * circumference
    const offset = nextOffset
    nextOffset -= percent

    return {
      accent: segment.accent,
      percent,
      offset,
    }
  })
})
</script>

<style lang="postcss" scoped>
.ui-donut-chart {
  display: grid;
  place-items: center;
  width: 100px;
  height: 100px;

  .chart-icon {
    grid-area: 1 / 1;
    z-index: 1;
  }

  svg {
    grid-area: 1 / 1;
  }

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
