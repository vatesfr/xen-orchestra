<template>
  <div class="progress-circle-container">
    <svg
      :width="circleSize"
      :height="circleSize"
      :viewBox="`0 0 ${circleSize} ${circleSize}`"
      xmlns="http://www.w3.org/2000/svg"
      class="progress-circle"
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
    </svg>
    <div v-if="size !== 'extra-small'" class="progress-circle-overlay">
      <VtsIcon v-if="isComplete" :icon="icon" class="progress-circle-icon" :accent="iconAccent" />
      <span v-else class="progress-circle-text" :class="fontClass">{{ percentValue }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import VtsIcon from '@core/components/icon/VtsIcon.vue'
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

const iconSizeMap = {
  'extra-small': '',
  small: '2rem',
  medium: '3rem',
  large: '9rem',
}

const strokeWidthMap = {
  'extra-small': 2,
  small: 4,
  medium: 6,
  large: 10,
}

const fontClasses = {
  'extra-small': '',
  small: 'typo-body-bold-small',
  medium: 'typo-h5',
  large: 'typo-h5',
}

const circleSize = sizeMap[size]
const fontClass = fontClasses[size]
const iconSize = iconSizeMap[size]
const strokeWidth = strokeWidthMap[size]
const radius = circleSize / 2 - strokeWidth / 2
const circumference = 2 * Math.PI * radius
const dashOffset = circumference * (1 - value / maxValue)

const isComplete = computed(() => value === maxValue)
const strokeColor = computed(() =>
  size === 'extra-small'
    ? `var(--color-${accent}-item-base)`
    : isComplete.value && (accent === 'info' || accent === 'success')
      ? 'var(--color-success-item-base)'
      : `var(--color-${accent}-item-base)`
)

const iconAccent = computed(() =>
  isComplete.value && (accent === 'info' || accent === 'success') ? 'success' : accent
)
const percentValue = computed(() => `${value}%`)
const icon = computed(() => (accent === 'warning' || accent === 'danger' ? faExclamation : faCheck))
</script>

<style lang="postcss" scoped>
.progress-circle-container {
  display: flex;
  width: v-bind(circleSize);
  height: v-bind(circleSize);
}

.progress-circle-background {
  stroke: var(--color-neutral-background-disabled);
  stroke-width: v-bind(strokeWidth);
}

.progress-circle-foreground {
  stroke-width: v-bind(strokeWidth);
  stroke-linecap: butt;
  transition: stroke-dashoffset 0.3s ease;
  transform: rotate(-90deg);
  transform-origin: center;
}

.progress-circle-fill {
  stroke: v-bind(strokeColor);
  stroke-dasharray: v-bind(circumference);
  stroke-dashoffset: v-bind(dashOffset);
}

.progress-circle-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: v-bind(strokeColor);
}

.progress-circle-text {
  color: v-bind(strokeColor);
}

.progress-circle-icon {
  font-size: v-bind(iconSize);
}
</style>
