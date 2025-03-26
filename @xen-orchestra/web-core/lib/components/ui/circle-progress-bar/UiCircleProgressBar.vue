<!-- v4 -->
<template>
  <div class="ui-circle-progress-bar">
    <svg
      :width="circleSize"
      :height="circleSize"
      :viewBox="`0 0 ${circleSize} ${circleSize}`"
      xmlns="http://www.w3.org/2000/svg"
      class="circle"
    >
      <circle :r="radius" :cx="circleSize / 2" :cy="circleSize / 2" fill="transparent" class="background" />
      <circle :r="radius" :cx="circleSize / 2" :cy="circleSize / 2" fill="transparent" class="foreground fill" />
    </svg>
    <div v-if="size !== 'extra-small'" class="overlay">
      <VtsIcon v-if="isComplete" :icon class="icon" :accent="iconAccent" />
      <span v-else class="text" :class="fontClass">{{ percentValue }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { faCheck, faExclamation } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const {
  accent,
  size,
  value,
  maxValue = 100,
} = defineProps<{
  accent: ProgressCircleAccent
  size: ProgressCircleSize
  value: number
  maxValue?: number
}>()

const { n } = useI18n()

type ProgressCircleAccent = 'info' | 'warning' | 'danger'
type ProgressCircleSize = 'extra-small' | 'small' | 'medium' | 'large'

const circleSizeMap = {
  'extra-small': 16,
  small: 40,
  medium: 64,
  large: 164,
}

const iconSizeMap = {
  'extra-small': undefined,
  small: '1.6rem',
  medium: '3.2rem',
  large: '4.8rem',
}

const strokeWidthMap = {
  'extra-small': 2,
  small: 4,
  medium: 6,
  large: 16,
}

const fontClassesMap = {
  'extra-small': undefined,
  small: 'typo-body-bold-small',
  medium: 'typo-h5',
  large: 'typo-h3',
}

const circleSize = computed(() => circleSizeMap[size])
const fontClass = computed(() => fontClassesMap[size])
const iconSize = computed(() => iconSizeMap[size])
const strokeWidth = computed(() => strokeWidthMap[size])

const radius = computed(() => (circleSize.value - strokeWidth.value) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)

const isComplete = computed(() => value >= maxValue)

const isCompleteWithSuccess = computed(() => isComplete.value && accent === 'info')

const strokeColorMap = {
  info: 'var(--color-info-item-base)',
  success: 'var(--color-success-item-base)',
  warning: 'var(--color-warning-item-base)',
  danger: 'var(--color-danger-item-base)',
}
const strokeColor = computed(() => {
  if (isCompleteWithSuccess.value) {
    return strokeColorMap.success
  }
  return strokeColorMap[accent]
})

const backgroundStrokeColor = computed(() => `var(--color-${accent}-background-selected)`)

const iconAccent = computed(() => (isCompleteWithSuccess.value ? 'success' : accent))
const valuePercent = computed(() => Math.round((value / maxValue) * 100))

const dashOffset = computed(() => {
  if (valuePercent.value > 100) return
  return circumference.value * (1 - valuePercent.value / 100)
})

const percentValue = computed(() => n(valuePercent.value / 100, 'percent'))

const icon = computed(() => (accent === 'warning' || accent === 'danger' ? faExclamation : faCheck))
</script>

<style lang="postcss" scoped>
.ui-circle-progress-bar {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  .background {
    stroke: v-bind(backgroundStrokeColor);
    stroke-width: v-bind(strokeWidth);
  }

  .foreground {
    stroke-width: v-bind(strokeWidth);
    stroke-linecap: butt;
    transition: stroke-dashoffset 0.3s ease;
    transform: rotate(-90deg);
    transform-origin: center;
  }

  .fill {
    stroke: v-bind(strokeColor);
    stroke-dasharray: v-bind(circumference);
    stroke-dashoffset: v-bind(dashOffset);
  }

  .overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .text {
    color: v-bind(strokeColor);
  }

  .icon {
    font-size: v-bind(iconSize);
  }
}
</style>
