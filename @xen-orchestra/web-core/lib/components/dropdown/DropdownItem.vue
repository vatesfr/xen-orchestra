<template>
  <div v-tooltip="{ selector: '.label' }" :class="[color, { disabled, selected }]" class="dropdown-item">
    <UiIcon v-if="checkbox" :color="color ?? 'info'" :icon="selected ? faSquareCheck : faSquare" />
    <slot name="icon">
      <UiIcon :icon />
    </slot>
    <div class="label p2 medium text-ellipsis">
      <slot />
    </div>
    <div v-if="info" class="info-text p3 italic">{{ info }}</div>
    <UiIcon v-if="arrow" :color="disabled ? undefined : 'info'" :icon="faAngleRight" class="right-icon" />
  </div>
</template>

<script lang="ts" setup>
import UiIcon from '@core/components/icon/UiIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import type { Color } from '@core/types/color.type'
import { IK_DROPDOWN_CHECKBOX } from '@core/utils/injection-keys.util'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faSquare } from '@fortawesome/free-regular-svg-icons'
import { faAngleRight, faSquareCheck } from '@fortawesome/free-solid-svg-icons'
import { computed, inject } from 'vue'

defineProps<{
  arrow?: boolean
  color?: Color
  disabled?: boolean
  icon?: IconDefinition
  info?: string
  selected?: boolean
}>()

const checkbox = inject(
  IK_DROPDOWN_CHECKBOX,
  computed(() => false)
)
</script>

<style lang="postcss" scoped>
/* COLOR VARIANTS */
.dropdown-item {
  & {
    --color: var(--color-neutral-txt-primary);
    --background-color: var(--color-neutral-background-primary);

    &:is(.active, .selected) {
      --color: var(--color-neutral-txt-primary);
      --background-color: var(--color-normal-background-selected);
    }

    &:is(:hover, .hover, :focus-visible) {
      --color: var(--color-neutral-txt-primary);
      --background-color: var(--color-normal-background-hover);
    }

    &:is(:active, .pressed) {
      --color: var(--color-neutral-txt-primary);
      --background-color: var(--color-normal-background-active);
    }

    &.disabled {
      --color: var(--color-neutral-txt-secondary);
      --background-color: var(--color-neutral-background-primary);
    }
  }

  &.info {
    --color: var(--color-normal-txt-base);
    --background-color: var(--color-neutral-background-primary);

    &:is(.active, .selected) {
      --color: var(--color-normal-txt-base);
      --background-color: var(--color-normal-background-selected);
    }

    &:is(:hover, .hover, :focus-visible) {
      --color: var(--color-normal-txt-hover);
      --background-color: var(--color-normal-background-hover);
    }

    &:is(:active, .pressed) {
      --color: var(--color-normal-txt-active);
      --background-color: var(--color-normal-background-active);
    }

    &.disabled {
      --color: var(--color-normal-item-disabled);
      --background-color: var(--color-neutral-background-primary);
    }
  }

  &.success {
    --color: var(--color-success-txt-base);
    --background-color: var(--color-neutral-background-primary);

    &:is(.active, .selected) {
      --color: var(--color-success-txt-base);
      --background-color: var(--color-success-background-selected);
    }

    &:is(:hover, .hover, :focus-visible) {
      --color: var(--color-success-txt-hover);
      --background-color: var(--color-success-background-hover);
    }

    &:is(:active, .pressed) {
      --color: var(--color-success-txt-active);
      --background-color: var(--color-success-background-active);
    }

    &.disabled {
      --color: var(--color-success-item-disabled);
      --background-color: var(--color-neutral-background-primary);
    }
  }

  &.warning {
    --color: var(--color-warning-txt-base);
    --background-color: var(--color-neutral-background-primary);

    &:is(.active, .selected) {
      --color: var(--color-warning-txt-base);
      --background-color: var(--color-warning-background-selected);
    }

    &:is(:hover, .hover, :focus-visible) {
      --color: var(--color-warning-txt-hover);
      --background-color: var(--color-warning-background-hover);
    }

    &:is(:active, .pressed) {
      --color: var(--color-warning-txt-active);
      --background-color: var(--color-warning-background-active);
    }

    &.disabled {
      --color: var(--color-warning-item-disabled);
      --background-color: var(--color-neutral-background-primary);
    }
  }

  &:is(.error, .danger) {
    --color: var(--color-danger-txt-base);
    --background-color: var(--color-neutral-background-primary);

    &:is(.active, .selected) {
      --color: var(--color-danger-txt-base);
      --background-color: var(--color-danger-background-selected);
    }

    &:is(:hover, .hover, :focus-visible) {
      --color: var(--color-danger-txt-hover);
      --background-color: var(--color-danger-background-hover);
    }

    &:is(:active, .pressed) {
      --color: var(--color-danger-txt-active);
      --background-color: var(--color-danger-background-active);
    }

    &.disabled {
      --color: var(--color-danger-item-disabled);
      --background-color: var(--color-neutral-background-primary);
    }
  }
}

/* IMPLEMENTATION */
.dropdown-item {
  display: flex;
  align-items: center;
  padding: 0.8rem;
  gap: 0.8rem;
  height: 3.7rem;
  color: var(--color);
  background: var(--background-color);
  border-radius: 0.4rem;
  margin: 0 0.4rem;
}

.label {
  margin-right: auto;
}

.info-text {
  color: var(--color-neutral-txt-secondary);
}
</style>
