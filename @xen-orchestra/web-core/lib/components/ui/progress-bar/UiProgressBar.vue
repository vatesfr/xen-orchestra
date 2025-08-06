<!-- v2 -->
<template>
  <div class="ui-progress-bar" :class="className">
    <div class="progress-bar">
      <div class="fill" :style="{ width: `${fillWidth}%` }" />
    </div>
    <VtsLegendList class="legend">
      <UiLegend v-if="displayMode === 'percent'" :accent :value="Math.round(percentage)" unit="%">
        {{ legend }}
      </UiLegend>
      <UiLegend v-else :accent :value="legendValue">
        {{ legend }}
      </UiLegend>
    </VtsLegendList>
  </div>
</template>

<script lang="ts" setup>
import VtsLegendList from '@core/components/legend-list/VtsLegendList.vue'
import UiLegend, { type LegendItemAccent } from '@core/components/ui/legend/UiLegend.vue'
import { useProgress } from '@core/composables/progress-bar.composable.ts'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { toVariants } from '@core/utils/to-variants.util'
import { computed } from 'vue'

interface Props {
  legend: string
  value: number
  thresholds?: {
    danger?: number
    warning?: number
  }
}

interface PercentageProps {
  max?: number
  displayMode: 'percent'
}

interface ValueProps {
  max: number
  displayMode: 'value'
}

const { value: _value, max: _max, displayMode, thresholds } = defineProps<Props & (PercentageProps | ValueProps)>()

const { percentage, fillWidth, value, max } = useProgress(
  () => _value,
  () => _max
)

const accent = computed((): LegendItemAccent => {
  if (thresholds !== undefined) {
    if (thresholds.danger !== undefined && percentage.value > thresholds.danger) {
      return 'danger'
    }

    if (thresholds.warning !== undefined && percentage.value > thresholds.warning) {
      return 'warning'
    }

    return 'info'
  }

  if (percentage.value >= 90) {
    return 'danger'
  }

  if (percentage.value >= 80) {
    return 'warning'
  }

  return 'info'
})

const className = computed(() => toVariants({ accent: accent.value }))

const formattedValue = computed(() => formatSizeRaw(value.value, 1))

const formattedMax = computed(() => formatSizeRaw(max.value, 0))

const legendValue = computed(() => {
  return `${formattedValue.value.value} ${formattedValue.value.prefix} / ${formattedMax.value.value} ${formattedMax.value.prefix}`
})
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
