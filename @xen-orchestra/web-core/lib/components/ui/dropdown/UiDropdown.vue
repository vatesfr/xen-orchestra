<!-- v7 -->
<template>
  <div v-tooltip="{ selector: '.text-ellipsis' }" :class="className" class="ui-dropdown">
    <UiCheckbox v-if="checkbox" :disabled :model-value="selected" accent="brand" />
    <slot name="icon">
      <VtsIcon :icon accent="current" />
    </slot>
    <div class="text-ellipsis typo-body-bold-small">
      <slot />
    </div>
    <div v-if="info" class="info typo-body-regular-small">{{ info }}</div>
    <VtsIcon
      v-if="subMenuIcon || locked"
      :accent="disabled ? 'current' : 'brand'"
      :icon="locked ? faLock : faAngleRight"
      class="right-icon"
      fixed-width
    />
  </div>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { toVariants } from '@core/utils/to-variants.util'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faAngleRight, faLock } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

export type DropdownAccent = 'normal' | 'brand' | 'success' | 'warning' | 'danger'

const {
  accent,
  disabled: _disabled,
  locked,
  selected,
  hover,
} = defineProps<{
  accent: DropdownAccent
  disabled?: boolean
  locked?: boolean
  selected?: boolean
  hover?: boolean
  checkbox?: boolean
  subMenuIcon?: boolean
  icon?: IconDefinition
  info?: string
}>()

const disabled = computed(() => _disabled || locked)

const className = computed(() =>
  toVariants({
    accent,
    disabled: disabled.value,
    selected,
    hover,
  })
)
</script>

<style lang="postcss" scoped>
.ui-dropdown {
  display: flex;
  align-items: center;
  padding: 1.2rem;
  gap: 0.8rem;
  height: 4.5rem;

  &.accent--normal {
    color: var(--color-neutral-txt-primary);
    background-color: var(--color-neutral-background-primary);

    &.selected {
      background-color: var(--color-brand-background-selected);
    }

    &:is(:hover, .hover) {
      background-color: var(--color-brand-background-hover);
    }

    &:active {
      background-color: var(--color-brand-background-active);
    }

    &.disabled {
      color: var(--color-neutral-txt-secondary);
      background-color: var(--color-neutral-background-disabled);
    }
  }

  &.accent--brand {
    color: var(--color-brand-txt-base);
    background-color: var(--color-neutral-background-primary);

    &.selected {
      color: var(--color-brand-txt-base);
      background-color: var(--color-brand-background-selected);
    }

    &:is(:hover, .hover) {
      color: var(--color-brand-txt-hover);
      background-color: var(--color-brand-background-hover);
    }

    &:active {
      color: var(--color-brand-txt-active);
      background-color: var(--color-brand-background-active);
    }

    &.disabled {
      color: var(--color-neutral-txt-secondary);
      background-color: var(--color-neutral-background-disabled);
    }
  }

  &.accent--success {
    color: var(--color-success-txt-base);
    background-color: var(--color-neutral-background-primary);

    &.selected {
      color: var(--color-success-txt-base);
      background-color: var(--color-success-background-selected);
    }

    &:is(:hover, .hover) {
      color: var(--color-success-txt-hover);
      background-color: var(--color-success-background-hover);
    }

    &:active {
      color: var(--color-success-txt-active);
      background-color: var(--color-success-background-active);
    }

    &.disabled {
      color: var(--color-neutral-txt-secondary);
      background-color: var(--color-neutral-background-primary);
    }
  }

  &.accent--warning {
    color: var(--color-warning-txt-base);
    background-color: var(--color-neutral-background-primary);

    &.selected {
      color: var(--color-warning-txt-base);
      background-color: var(--color-warning-background-selected);
    }

    &:is(:hover, .hover) {
      color: var(--color-warning-txt-hover);
      background-color: var(--color-warning-background-hover);
    }

    &:active {
      color: var(--color-warning-txt-active);
      background-color: var(--color-warning-background-active);
    }

    &.disabled {
      color: var(--color-neutral-txt-secondary);
      background-color: var(--color-neutral-background-primary);
    }
  }

  &.accent--danger {
    color: var(--color-danger-txt-base);
    background-color: var(--color-neutral-background-primary);

    &.selected {
      color: var(--color-danger-txt-base);
      background-color: var(--color-danger-background-selected);
    }

    &:is(:hover, .hover) {
      color: var(--color-danger-txt-hover);
      background-color: var(--color-danger-background-hover);
    }

    &:active {
      color: var(--color-danger-txt-active);
      background-color: var(--color-danger-background-active);
    }

    &.disabled {
      color: var(--color-neutral-txt-secondary);
      background-color: var(--color-neutral-background-primary);
    }
  }

  &:focus-visible {
    outline: none;

    &::before {
      content: '';
      position: absolute;
      inset: 0.2rem;
      border: 0.2rem solid var(--color-info-txt-base);
      border-radius: 0.4rem;
    }
  }

  .info {
    color: var(--color-neutral-txt-secondary);
  }

  .right-icon {
    font-size: 1.2rem;
  }
}
</style>
