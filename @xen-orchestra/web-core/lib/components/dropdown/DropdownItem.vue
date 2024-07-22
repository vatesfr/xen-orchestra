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
    --color: var(--color-grey-100);
    --background-color: var(--background-color-primary);

    &:is(.active, .selected) {
      --color: var(--color-grey-100);
      --background-color: var(--background-color-purple-10);
    }

    &:is(:hover, .hover, :focus-visible) {
      --color: var(--color-grey-100);
      --background-color: var(--background-color-purple-20);
    }

    &:is(:active, .pressed) {
      --color: var(--color-grey-100);
      --background-color: var(--background-color-purple-30);
    }

    &.disabled {
      --color: var(--color-grey-400);
      --background-color: var(--background-color-primary);
    }
  }

  &.info {
    --color: var(--color-purple-base);
    --background-color: var(--background-color-primary);

    &:is(.active, .selected) {
      --color: var(--color-purple-base);
      --background-color: var(--background-color-purple-10);
    }

    &:is(:hover, .hover, :focus-visible) {
      --color: var(--color-purple-d20);
      --background-color: var(--background-color-purple-20);
    }

    &:is(:active, .pressed) {
      --color: var(--color-purple-d40);
      --background-color: var(--background-color-purple-30);
    }

    &.disabled {
      --color: var(--color-purple-l60);
      --background-color: var(--background-color-primary);
    }
  }

  &.success {
    --color: var(--color-green-base);
    --background-color: var(--background-color-primary);

    &:is(.active, .selected) {
      --color: var(--color-green-base);
      --background-color: var(--background-color-green-10);
    }

    &:is(:hover, .hover, :focus-visible) {
      --color: var(--color-green-d20);
      --background-color: var(--background-color-green-20);
    }

    &:is(:active, .pressed) {
      --color: var(--color-green-d40);
      --background-color: var(--background-color-green-30);
    }

    &.disabled {
      --color: var(--color-green-l60);
      --background-color: var(--background-color-primary);
    }
  }

  &.warning {
    --color: var(--color-orange-base);
    --background-color: var(--background-color-primary);

    &:is(.active, .selected) {
      --color: var(--color-orange-base);
      --background-color: var(--background-color-orange-10);
    }

    &:is(:hover, .hover, :focus-visible) {
      --color: var(--color-orange-d20);
      --background-color: var(--background-color-orange-20);
    }

    &:is(:active, .pressed) {
      --color: var(--color-orange-d40);
      --background-color: var(--background-color-orange-30);
    }

    &.disabled {
      --color: var(--color-orange-l60);
      --background-color: var(--background-color-primary);
    }
  }

  &:is(.error, .danger) {
    --color: var(--color-red-base);
    --background-color: var(--background-color-primary);

    &:is(.active, .selected) {
      --color: var(--color-red-base);
      --background-color: var(--background-color-red-10);
    }

    &:is(:hover, .hover, :focus-visible) {
      --color: var(--color-red-d20);
      --background-color: var(--background-color-red-20);
    }

    &:is(:active, .pressed) {
      --color: var(--color-red-d40);
      --background-color: var(--background-color-red-30);
    }

    &.disabled {
      --color: var(--color-red-l60);
      --background-color: var(--background-color-primary);
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
  color: var(--color-grey-300);
}
</style>
