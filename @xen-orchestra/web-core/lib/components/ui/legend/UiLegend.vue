<!-- v7 -->
<template>
  <li :class="classNames" class="ui-legend">
    <VtsIcon name="fa:circle" size="extra-small" class="circle-icon" />
    <span class="label typo-body-regular-small"><slot /></span>
    <UiButtonIcon
      v-if="modalInfo"
      v-tooltip="t('more-information')"
      class="modal-info"
      accent="brand"
      icon="fa:info-circle"
      size="small"
      @click="emit('openModal')"
    />
    <span v-if="valueLabel" class="value-and-unit typo-caption-int-small">{{ valueLabel }}</span>
  </li>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { toVariants } from '@core/utils/to-variants.util'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export type LegendItemAccent = 'info' | 'secondary' | 'success' | 'warning' | 'danger' | 'muted'

export type LegendItemProps = {
  accent: LegendItemAccent
  value?: number | string
  unit?: string
  modalInfo?: boolean
}

const { value, unit, accent } = defineProps<LegendItemProps>()

const emit = defineEmits<{
  openModal: []
}>()

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

  .circle-icon {
    height: 2.4rem;
    display: flex;
    align-items: center;
  }

  .modal-info {
    height: 2.4rem;
    display: flex;
    align-items: center;
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
