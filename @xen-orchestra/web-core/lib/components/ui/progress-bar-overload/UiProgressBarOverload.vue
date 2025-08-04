<!-- v2 -->
<template>
  <div class="ui-progress-bar" :class="className">
    <div class="progress-bar-n-data-ruler">
      <UiDataRuler :steps :accent />
      <div class="progress-bar">
        <div class="fill" :style="{ width: `${fillWidth}%` }" />
      </div>
    </div>
    <VtsLegendList class="legend">
      <UiLegend :accent :value="Math.round(percentage)" unit="%">
        {{ legend }}
      </UiLegend>
    </VtsLegendList>
  </div>
</template>

<script lang="ts" setup>
import VtsLegendList from '@core/components/legend-list/VtsLegendList.vue'
import UiDataRuler from '@core/components/ui/data-ruler/UiDataRuler.vue'
import UiLegend from '@core/components/ui/legend/UiLegend.vue'
import { useProgress } from '@core/composables/progress-bar.composable.ts'
import { toVariants } from '@core/utils/to-variants.util'
import { computed } from 'vue'

const { value, max } = defineProps<{
  legend: string
  value: number
  max?: number
}>()

const { percentage, fillWidth, steps } = useProgress(
  () => value,
  () => max
)

const accent = computed(() => {
  if (percentage.value > 300) {
    return 'danger'
  }

  if (percentage.value > 100) {
    return 'warning'
  }

  return 'info'
})

const className = computed(() => toVariants({ accent: accent.value }))
</script>

<style lang="postcss" scoped>
.ui-progress-bar {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  .progress-bar-n-data-ruler {
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
  }

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
