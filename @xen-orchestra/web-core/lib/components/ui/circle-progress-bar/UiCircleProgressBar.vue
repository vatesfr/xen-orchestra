<!-- v4 -->
<template>
  <div class="ui-circle-progress-bar" :class="className">
    <svg
      :width="circleSize"
      :height="circleSize"
      :viewBox="`0 0 ${circleSize} ${circleSize}`"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle :r="radius" :cx="circleSize / 2" :cy="circleSize / 2" fill="transparent" class="background" />
      <circle
        :r="radius"
        :cx="circleSize / 2"
        :cy="circleSize / 2"
        fill="transparent"
        class="fill"
        :class="{ success: isCompleteWithSuccess }"
      />
    </svg>
    <div v-if="size !== 'extra-small'" class="overlay">
      <VtsIcon v-if="isComplete" class="icon" :icon :accent="iconAccent" />
      <span v-else>{{ percentValue }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { faCheck, faExclamation } from '@fortawesome/free-solid-svg-icons'
import { useClamp, useMax } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const {
  accent,
  size,
  value: _value,
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
const strokeWidth = computed(() => strokeWidthMap[size])

const radius = computed(() => (circleSize.value - strokeWidth.value) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)

const value = useMax(0, () => _value)
const valuePercent = useClamp(() => (value.value / maxValue) * 100 || 0, 0, 100)

const isComplete = computed(() => valuePercent.value >= 100)
const isCompleteWithSuccess = computed(() => isComplete.value && accent === 'info')

const dashOffset = computed(() => {
  if (valuePercent.value > 100) return
  return circumference.value * (1 - valuePercent.value / 100)
})

const percentValue = computed(() => n(valuePercent.value / 100, 'percent'))

const iconAccent = computed(() => (isCompleteWithSuccess.value ? 'success' : accent))
const icon = computed(() => (accent === 'warning' || accent === 'danger' ? faExclamation : faCheck))

const className = computed(() => [
  fontClass.value,
  toVariants({
    accent,
    size,
  }),
])
</script>

<style lang="postcss" scoped>
.ui-circle-progress-bar {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  /* ACCENT */

  &.accent--info {
    color: var(--color-info-item-base);

    .fill {
      stroke: var(--color-info-item-base);
    }

    .background {
      stroke: var(--color-info-background-selected);
    }

    .success {
      stroke: var(--color-success-item-base);
    }
  }

  &.accent--warning {
    color: var(--color-warning-item-base);

    .fill {
      stroke: var(--color-warning-item-base);
    }

    .background {
      stroke: var(--color-warning-background-selected);
    }
  }

  &.accent--danger {
    color: var(--color-danger-item-base);

    .fill {
      stroke: var(--color-danger-item-base);
    }

    .background {
      stroke: var(--color-danger-background-selected);
    }
  }

  /* SIZE */

  &.size--extra-small {
    .background,
    .fill {
      stroke-width: 2;
    }
  }

  &.size--small {
    .icon {
      font-size: 1.6rem;
    }

    .background,
    .fill {
      stroke-width: 4;
    }
  }

  &.size--medium {
    .icon {
      font-size: 3.2rem;
    }

    .background,
    .fill {
      stroke-width: 6;
    }
  }

  &.size--large {
    .icon {
      font-size: 4.8rem;
    }

    .background,
    .fill {
      stroke-width: 16;
    }
  }

  .fill {
    stroke-linecap: butt;
    transition: stroke-dashoffset 0.3s ease;
    transform: rotate(-90deg);
    transform-origin: center;
    stroke-dasharray: v-bind(circumference);
    stroke-dashoffset: v-bind(dashOffset);
  }

  .overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
}
</style>
