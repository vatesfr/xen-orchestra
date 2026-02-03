<!-- v3 -->
<template>
  <li :class="classNames" class="ui-legend">
    <VtsIcon name="fa:circle" size="medium" class="circle-icon" />
    <span class="label typo-body-regular-small"><slot /></span>
    <VtsIcon v-if="tooltip" v-tooltip="tooltip" name="fa:info-circle" size="medium" class="tooltip-icon" />
    <span v-if="valueLabel" class="value-and-unit typo-caption-small">{{ valueLabel }}</span>
  </li>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { toVariants } from '@core/utils/to-variants.util'
import { computed } from 'vue'

export type LegendItemAccent = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'muted'

export type LegendItemProps = {
  accent: LegendItemAccent
  value?: number | string
  unit?: string
  tooltip?: string
}

const { value, unit, accent } = defineProps<LegendItemProps>()

defineSlots<{
  default(): any
}>()

const valueLabel = computed(() => [value, unit].join(' ').trim())

const classNames = computed(() => toVariants({ accent }))
</script>

<style lang="postcss" scoped>
.ui-legend {
  display: flex;
  align-items: center;
  gap: 0.8rem;

  .circle-icon {
    font-size: 0.8rem;
  }

  .tooltip-icon {
    font-size: 1.2rem;
    color: var(--color-info-item-base);
  }

  .label {
    color: var(--color-neutral-txt-primary);
  }

  .value-and-unit {
    color: var(--color-neutral-txt-secondary);
  }

  /* COLORS VARIANTS */

  &.accent--neutral {
    .circle-icon {
      color: var(--color-neutral-txt-secondary);
    }
  }

  &.accent--info {
    .circle-icon {
      color: var(--color-info-item-base);
    }
  }

  &.accent--success {
    .circle-icon {
      color: var(--color-success-item-base);
    }
  }

  &.accent--warning {
    .circle-icon {
      color: var(--color-warning-item-base);
    }
  }

  &.accent--danger {
    .circle-icon {
      color: var(--color-danger-item-base);
    }
  }

  &.accent--muted {
    .circle-icon {
      color: var(--color-neutral-background-disabled);
    }
  }
}
</style>
