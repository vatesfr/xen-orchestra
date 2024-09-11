<!-- v1.0 -->
<template>
  <li :class="color" class="legend-item">
    <UiIcon :icon="faCircle" color="current" class="circle-icon" />
    <span class="label typo p3-regular"><slot /></span>
    <UiIcon v-if="tooltip" v-tooltip="tooltip" :icon="faCircleInfo" class="tooltip-icon" color="normal" />
    <span v-if="valueLabel" class="value-and-unit typo c3-semi-bold">{{ valueLabel }}</span>
  </li>
</template>

<script lang="ts" setup>
import UiIcon from '@core/components/icon/UiIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faCircle, faCircleInfo } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

export type LegendItemColor = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'disabled'

export type LegendItemProps = {
  color: LegendItemColor
  value?: number
  unit?: string
  tooltip?: string
}

const props = defineProps<LegendItemProps>()

defineSlots<{
  default(): void
}>()

const valueLabel = computed(() => [props.value, props.unit].join(' ').trim())
</script>

<style lang="postcss" scoped>
/* COLOR VARIANTS */
.legend-item {
  &.primary {
    --circle-color: var(--color-normal-item-base);
  }

  &.secondary {
    --circle-color: var(--color-neutral-txt-primary);
  }

  &.success {
    --circle-color: var(--color-success-item-base);
  }

  &.warning {
    --circle-color: var(--color-warning-item-base);
  }

  &.danger {
    --circle-color: var(--color-danger-item-base);
  }

  &.disabled {
    --circle-color: var(--color-neutral-background-disabled);
  }
}

/* IMPLEMENTATION */
.legend-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.circle-icon {
  font-size: 0.8rem;
  color: var(--circle-color);
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
</style>
