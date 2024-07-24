<!-- v1.0 -->
<template>
  <li :class="color" class="legend-item">
    <UiIcon :icon="faCircle" class="circle-icon" />
    <span class="label typo p3-regular"><slot /></span>
    <UiIcon v-if="tooltip" v-tooltip="tooltip" :icon="faCircleInfo" class="tooltip-icon" color="info" />
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
    --circle-color: var(--color-purple-base);
  }

  &.secondary {
    --circle-color: var(--color-grey-100);
  }

  &.success {
    --circle-color: var(--color-green-base);
  }

  &.warning {
    --circle-color: var(--color-orange-base);
  }

  &.danger {
    --circle-color: var(--color-red-base);
  }

  &.disabled {
    --circle-color: var(--color-grey-300);
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
  color: var(--color-grey-000);
}

.value-and-unit {
  color: var(--color-grey-300);
}
</style>
