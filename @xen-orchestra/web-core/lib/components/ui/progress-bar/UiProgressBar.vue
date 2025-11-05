<!-- v2 -->
<template>
  <div :class="className" class="ui-progress-bar">
    <div class="progress-bar">
      <div :style="{ width: fillWidth }" class="fill" />
    </div>
    <VtsLegendList v-if="legend" class="legend">
      <UiLegend :accent :value="legend.value">
        {{ legend.label }}
      </UiLegend>
    </VtsLegendList>
  </div>
</template>

<script lang="ts" setup>
import VtsLegendList from '@core/components/legend-list/VtsLegendList.vue'
import UiLegend from '@core/components/ui/legend/UiLegend.vue'
import { toVariants } from '@core/utils/to-variants.util'
import { computed } from 'vue'

export type ProgressBarAccent = 'info' | 'warning' | 'danger'

export type ProgressBarLegend = { label: string; value?: string | number }

const { accent, legend } = defineProps<{
  accent: ProgressBarAccent
  fillWidth: string
  legend?: ProgressBarLegend
}>()

const className = computed(() => toVariants({ accent }))
</script>

<style lang="postcss" scoped>
.ui-progress-bar {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  .progress-bar {
    width: 100%;
    border-radius: 0.4rem;
    overflow: hidden;
    background-color: var(--color-neutral-background-disabled);

    .fill {
      width: 0;
      height: 1.2rem;
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
