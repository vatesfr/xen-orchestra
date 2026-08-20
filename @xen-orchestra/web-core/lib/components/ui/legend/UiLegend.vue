<!-- v6 -->
<template>
  <li :class="classNames" class="ui-legend">
    <VtsIcon name="fa:circle" size="current" class="circle-icon" />
    <span class="label typo-body-regular-small"><slot /></span>
    <UiButtonIcon
      v-if="onInfoClick"
      v-tooltip="t('more-information')"
      class="info-button"
      accent="brand"
      icon="fa:info-circle"
      size="small"
      @click="onInfoClick()"
    />
    <span v-if="valueLabel" class="value-and-unit typo-caption-small">{{ valueLabel }}</span>
  </li>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { toVariants } from '@core/utils/to-variants.util'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export type LegendItemAccent = 'info' | 'secondary' | 'success' | 'warning' | 'danger' | 'muted'

export type LegendItemProps = {
  accent: LegendItemAccent
  value?: number | string
  unit?: string
  onInfoClick?: () => void
}

const { value, unit, accent } = defineProps<LegendItemProps>()

defineSlots<{
  default(): any
}>()

const { t } = useI18n()

const valueLabel = computed(() => [value, unit].join(' ').trim())

const classNames = computed(() => toVariants({ accent }))
</script>

<style lang="postcss" scoped>
.ui-legend {
  display: flex;
  gap: 0.8rem;
  align-items: center;

  .circle-icon {
    font-size: 0.8rem;
  }

  .info-button {
    color: var(--color-info-item-base);
  }

  .label {
    color: var(--color-neutral-txt-primary);
  }

  .value-and-unit {
    color: var(--color-neutral-txt-secondary);
  }

  /* COLORS VARIANTS */

  &.accent--info {
    .circle-icon {
      color: var(--color-info-item-base);
    }
  }

  &.accent--secondary {
    .circle-icon {
      color: var(--color-neutral-txt-secondary);
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
