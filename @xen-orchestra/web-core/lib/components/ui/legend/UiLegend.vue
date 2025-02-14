<!-- v3 -->
<template>
  <li :class="classNames" class="ui-legend">
    <VtsIcon :icon="faCircle" accent="current" class="circle-icon" />
    <span class="label typo p3-regular"><slot /></span>
    <VtsIcon v-if="tooltip" v-tooltip="tooltip" :icon="faCircleInfo" class="tooltip-icon" accent="brand" />
    <span v-if="valueLabel" class="value-and-unit typo c3-semi-bold">{{ valueLabel }}</span>
  </li>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { toVariants } from '@core/utils/to-variants.util'
import { faCircle, faCircleInfo } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

export type LegendItemAccent = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'muted'

export type LegendItemProps = {
  accent: LegendItemAccent
  value?: number
  unit?: string
  tooltip?: string
}

const props = defineProps<LegendItemProps>()

defineSlots<{
  default(): void
}>()

const valueLabel = computed(() => [props.value, props.unit].join(' ').trim())

const classNames = computed(() => toVariants({ accent: props.accent }))
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
      color: var(--color-neutral-txt-primary);
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
