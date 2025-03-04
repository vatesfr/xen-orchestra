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

const circleSize = computed(() => sizeMap[size])
const fontClass = computed(() => fontClasses[size])
const iconSize = computed(() => iconSizeMap[size])
const strokeWidth = computed(() => strokeWidthMap[size])
const radius = computed(() => (circleSize.value - strokeWidth.value) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)

const isComplete = computed(() => value >= maxValue)
const strokeColor = computed(() =>
  size === 'extra-small'
    ? `var(--color-${accent}-item-base)`
    : isComplete.value && (accent === 'info' || accent === 'success')
      ? 'var(--color-success-item-base)'
      : `var(--color-${accent}-item-base)`
)

const backgroundStrokeColor = computed(() => `var(--color-${accent}-background-selected)`)

const iconAccent = computed(() =>
  isComplete.value && (accent === 'info' || accent === 'success') ? 'success' : accent
)
const valuePercent = computed(() => Math.round((value / maxValue) * 100))

const dashOffset = computed(() => {
  if (valuePercent.value > 100) return
  return circumference.value * (1 - valuePercent.value / 100)
})

const percentValue = computed(() => `${valuePercent.value}%`)

const icon = computed(() => (accent === 'warning' || accent === 'danger' ? faExclamation : faCheck))
</script>

<style lang="postcss" scoped>
.progress-circle-container {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.progress-circle-background {
  stroke: v-bind(backgroundStrokeColor);
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
}

.progress-circle-text {
  color: v-bind(strokeColor);
}

.progress-circle-icon {
  font-size: v-bind(iconSize);
}
</style>
