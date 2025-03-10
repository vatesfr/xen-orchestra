<!-- v2 -->
<template>
  <div class="ui-progress-bar" :class="accentClass">
    <div class="progress-bar">
      <div class="fill" :style="{ width: `${fillWidth}%` }" />
    </div>
    <div v-if="shouldShowSteps" class="steps typo-body-regular-small">
      <span>{{ $n(0, 'percent') }}</span>
      <span v-for="step in steps" :key="step">{{ $n(step, 'percent') }}</span>
    </div>
    <VtsLegendList class="legend">
      <UiLegend :accent :value="percentage" unit="%">{{ legend }}</UiLegend>
    </VtsLegendList>
  </div>
</template>

<script lang="ts" setup>
import VtsLegendList from '@core/components/legend-list/VtsLegendList.vue'
import UiLegend from '@core/components/ui/legend/UiLegend.vue'
import { toVariants } from '@core/utils/to-variants.util'
import { useMax } from '@vueuse/math'
import { computed } from 'vue'

const {
  value: _value,
  max = 100,
  showSteps,
} = defineProps<{
  legend: string
  value: number
  max?: number
  showSteps?: boolean
}>()

const value = useMax(0, () => _value)

const isInvalid = computed(() => !Number.isFinite(value.value / max) || value.value <= 0)

const percentage = computed(() => (isInvalid.value ? 0 : Math.round((value.value / max) * 100)))

const maxPercentage = computed(() => (isInvalid.value ? 100 : Math.ceil(percentage.value / 100) * 100))

const fillWidth = computed(() => Math.max(0, Math.min((percentage.value / maxPercentage.value) * 100, 100)))

const shouldShowSteps = computed(() => showSteps || (value.value > max && percentage.value > 0))

const steps = computed(() => Math.floor(maxPercentage.value / 100))

const accent = computed(() => {
  if (percentage.value >= 90) {
    return 'danger'
  }

  if (percentage.value >= 80) {
    return 'warning'
  }

  return 'info'
})

const accentClass = computed(() => toVariants({ accent: accent.value }))
</script>

<style lang="postcss" scoped>
.ui-progress-bar {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  .progress-bar {
    width: 100%;
    height: 1.2rem;
    border-radius: 0.4rem;
    overflow: hidden;
    background-color: var(--color-neutral-background-disabled);

    .fill {
      width: 0;
      height: 100%;
      transition: width 0.25s ease-in-out;
    }
  }

  .steps {
    color: var(--color-neutral-txt-secondary);
    display: flex;
    justify-content: space-between;
  }

  .legend {
    margin-inline-start: auto;
  }

  /* ACCENT */

  &.accent--info {
    .fill {
      background-color: var(--color-info-item-base);
    }
  }

  &.accent--warning {
    .fill {
      background-color: var(--color-warning-item-base);
    }
  }

  &.accent--danger {
    .fill {
      background-color: var(--color-danger-item-base);
    }
  }
}
</style>
