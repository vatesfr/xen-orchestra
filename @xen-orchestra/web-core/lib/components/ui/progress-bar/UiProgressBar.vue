<!-- v2 -->
<template>
  <div class="ui-progress-bar" :class="className">
    <div class="progress-bar">
      <div class="fill" :style="{ width: `${fillWidth}%` }" />
    </div>
    <div v-if="shouldShowSteps" class="steps typo-body-regular-small">
      <span>{{ n(0, 'percent') }}</span>
      <span v-for="step in steps" :key="step">{{ n(step, 'percent') }}</span>
    </div>
    <VtsLegendList class="legend">
      <UiLegend v-if="displayMode === 'percent'" :accent :value="Math.round(percent ? percent : percentage)" unit="%">
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
import UiLegend from '@core/components/ui/legend/UiLegend.vue'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { toVariants } from '@core/utils/to-variants.util'
import { useClamp, useMax } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const {
  value: _value,
  max = 100,
  showSteps,
  displayMode = 'percent',
} = defineProps<{
  legend: string
  value: number
  max?: number
  percent?: number
  showSteps?: boolean
  displayMode?: 'percent' | 'value'
}>()

const { n } = useI18n()

const value = useMax(0, () => _value)

const percentage = computed(() => (max <= 0 ? 0 : (value.value / max) * 100))
const maxPercentage = computed(() => Math.ceil(percentage.value / 100) * 100)
const fillWidth = useClamp(() => (percentage.value / maxPercentage.value) * 100 || 0, 0, 100)
const shouldShowSteps = computed(() => showSteps || percentage.value > 100)
const steps = useMax(1, () => Math.floor(maxPercentage.value / 100))

const accent = computed(() => {
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

const formattedMax = computed(() => formatSizeRaw(max, 0))

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
