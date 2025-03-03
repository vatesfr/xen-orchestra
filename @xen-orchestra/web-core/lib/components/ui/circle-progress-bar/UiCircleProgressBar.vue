<template>
  <svg
    :width="circleSize"
    :height="circleSize"
    :viewBox="`0 0 ${circleSize} ${circleSize}`"
    xmlns="http://www.w3.org/2000/svg"
    class="progress-circle"
    :class="classNames"
  >
    <circle
      :r="radius"
      :cx="circleSize / 2"
      :cy="circleSize / 2"
      fill="transparent"
      class="progress-circle-background"
    />
    <circle
      :r="radius"
      :cx="circleSize / 2"
      :cy="circleSize / 2"
      fill="transparent"
      class="progress-circle-foreground progress-circle-fill"
    />
    <template v-if="size !== 'extra-small'">
      <template v-if="isComplete">
        <VtsIcon :icon="icon" :accent="iconAccent" class="progress-circle-icon" />
      </template>
      <template v-else>
        <text :x="circleSize / 2" :y="circleSize / 2 + 8" class="progress-circle-text typo-h5" :style="{ fontSize }">
          {{ percentValue }}
        </text>
      </template>
    </template>
  </svg>
</template>

<script setup lang="ts">
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { toVariants } from '@core/utils/to-variants.util'
import { faCheck, faExclamation } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const { accent, size, value, maxValue } = defineProps<{
  accent: ProgressCircleAccent
  size: ProgressCircleSize
  value: number
  maxValue: number
}>()

type ProgressCircleAccent = 'info' | 'success' | 'warning' | 'danger'
type ProgressCircleSize = 'extra-small' | 'small' | 'medium' | 'large'

const sizeMap = {
  'extra-small': 16,
  small: 40,
  medium: 64,
  large: 164,
}

const fontSizeMap = {
  'extra-small': '12px',
  small: '14px',
  medium: '18px',
  large: '24px',
}

const strokeWidthMap = {
  'extra-small': 2,
  small: 4,
  medium: 6,
  large: 10,
}

const circleSize = sizeMap[size]
const fontSize = fontSizeMap[size]
const strokeWidth = strokeWidthMap[size]
const radius = circleSize / 2 - strokeWidth / 2
const circumference = 2 * Math.PI * radius
const dashOffset = circumference * (1 - value / maxValue)

const isComplete = computed(() => value === maxValue)
const strokeColor = computed(() => {
  if (isComplete.value && (accent === 'info' || accent === 'success')) {
    return 'var(--color-success-item-base)'
  }
  return `var(--color-${accent}-item-base)`
})

const iconAccent = computed(() => {
  return isComplete.value && (accent === 'info' || accent === 'success') ? 'success' : accent
})
const percentValue = computed(() => `${value}%`)
const icon = computed(() => (accent === 'warning' || accent === 'danger' ? faExclamation : faCheck))

const fontClasses = {
  small: 'typo-action-button-small',
  medium: 'typo-action-button',
  large: 'typo-h3',
}

const classNames = computed(() => [
  fontClasses[size],
  toVariants({
    accent,
    size,
  }),
])
</script>

<style lang="postcss" scoped>
.progress-circle-background {
  stroke-width: v-bind(strokeWidth);
}

.progress-circle-foreground {
  stroke-width: v-bind(strokeWidth);
  stroke-linecap: butt;
  transition: stroke-dashoffset 0.3s ease;
  transform: rotate(-90deg);
  transform-origin: center;
  /*transform-box: fill-box;*/
}

.progress-circle-fill {
  stroke: v-bind(strokeColor);
  stroke-dasharray: v-bind(circumference);
  stroke-dashoffset: v-bind(dashOffset);
}

.progress-circle-text {
  fill: v-bind(strokeColor);
  text-anchor: middle;
}

.accent--success {
  .progress-circle-background {
    stroke: var(--color-success-background-selected);
  }
}

.accent--info {
  .progress-circle-background {
    stroke: var(--color-info-background-selected);
  }
}

.accent--warning {
  .progress-circle-background {
    stroke: var(--color-warning-background-selected);
  }
}

.accent--danger {
  .progress-circle-background {
    stroke: var(--color-danger-background-selected);
  }
}
</style>
