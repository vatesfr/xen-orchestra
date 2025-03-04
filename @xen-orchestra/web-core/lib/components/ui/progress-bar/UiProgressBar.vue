<!-- v2 -->
<template>
  <div class="ui-progress-bar" :class="classes">
    <div class="progress-bar">
      <div class="segment" :style="{ width: `${percentage}%` }" />
    </div>
    <div v-if="steps" class="steps typo-body-regular-small">
      <span>{{ `${steps[0]}%` }}</span>
      <span>{{ `${steps[1]}%` }}</span>
      <span>{{ `${steps[2]}%` }}</span>
    </div>
    <VtsLegendList class="legend">
      <UiLegend :accent :value="rawPercentage" unit="%">{{ legend }}</UiLegend>
    </VtsLegendList>
  </div>
</template>

<script lang="ts" setup>
import VtsLegendList from '@core/components/legend-list/VtsLegendList.vue'
import UiLegend from '@core/components/ui/legend/UiLegend.vue'
import { toVariants } from '@core/utils/to-variants.util'
import { computed } from 'vue'

const { value, max, steps } = defineProps<{
  legend: string
  value: number
  max?: number
  steps?: [number, number, number]
}>()

const rawPercentage = computed(() => Math.round((value / (max ?? 100)) * 1000) / 10)

const percentage = computed(() => {
  if (!steps) {
    return rawPercentage.value
  }

  const relativeValue = (value / (max ?? 100)) * 100

  return Math.min(100, Math.round(relativeValue * steps?.[1]) / steps?.[2])
})

const accent = computed(() => {
  if (percentage.value >= 90) {
    return 'danger'
  }

  if (percentage.value >= 80) {
    return 'warning'
  }

  return 'info'
})

const classes = computed(() => toVariants({ accent: accent.value }))
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

    .segment {
      height: 100%;
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
    .segment {
      background-color: var(--color-info-item-base);
    }
  }

  &.accent--warning {
    .segment {
      background-color: var(--color-warning-item-base);
    }
  }

  &.accent--danger {
    .segment {
      background-color: var(--color-danger-item-base);
    }
  }
}
</style>
