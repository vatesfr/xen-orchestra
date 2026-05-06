<!-- v8 -->
<template>
  <span :class="classNames" class="ui-chip typo-body-regular-small">
    <span class="content text-ellipsis">
      <slot />
    </span>
    <button v-if="!disabled" class="icon" type="button" @click.stop="emit('remove')">
      <VtsIcon name="action:close-cancel-clear" size="medium" />
    </button>
  </span>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import type { IconName } from '@core/icons'
import { toVariants } from '@core/utils/to-variants.util'
import { computed } from 'vue'

export type ChipAccent = 'normal' | 'success' | 'warning' | 'danger'

const { accent, disabled } = defineProps<{
  accent: ChipAccent
  icon?: IconName
  disabled?: boolean
}>()

const emit = defineEmits<{
  remove: []
}>()

defineSlots<{
  default(): any
}>()

const classNames = computed(() => {
  return [
    toVariants({
      accent,
      muted: disabled,
    }),
  ]
})
</script>

<style lang="postcss" scoped>
.ui-chip {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  border-radius: 10rem;
  color: var(--color-neutral-txt-primary);
  cursor: pointer;
  min-height: 2.4rem;
  vertical-align: middle;
  white-space: nowrap;
  min-width: 0;

  &.muted {
    color: var(--color-neutral-txt-secondary);
    pointer-events: none;
  }

  .content {
    line-height: 1.6rem;
    padding: 0.4rem 0.8rem;
  }

  .icon {
    border-radius: 0 10rem 10rem 0;
    padding: 0.4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    outline: none;
    border: none;
  }

  &:has(.icon:focus-visible)::before {
    content: '';
    position: absolute;
    inset: -0.4rem;
    border-radius: 0.4rem;
    border: 0.2rem solid var(--color-brand-txt-base);
  }

  .icon::after {
    content: '';
    position: absolute;
    inset: 0;
    transform: scale(2, 1.5);
  }
  /* COLOR VARIANTS */

  &.accent--normal {
    background-color: var(--color-info-background-selected);

    .icon {
      color: var(--color-info-txt-hover);
      background-color: var(--color-info-background-selected);
    }

    .icon:is(:hover, :focus-visible) {
      background-color: var(--color-info-background-hover);
    }

    .icon:active {
      background-color: var(--color-info-background-active);
    }

    &.muted {
      background-color: var(--color-info-item-disabled);
    }
  }

  &.accent--success {
    background-color: var(--color-success-background-selected);

    .icon {
      color: var(--color-success-txt-hover);
      background-color: var(--color-success-background-selected);
    }

    .icon:is(:hover, :focus-visible) {
      background-color: var(--color-success-background-hover);
    }

    .icon:active {
      background-color: var(--color-success-background-active);
    }

    &.muted {
      background-color: var(--color-success-item-disabled);
    }
  }

  &.accent--warning {
    background-color: var(--color-warning-background-selected);

    .icon {
      color: var(--color-warning-txt-hover);
      background-color: var(--color-warning-background-selected);
    }

    .icon:is(:hover, :focus-visible) {
      background-color: var(--color-warning-background-hover);
    }

    .icon:active {
      background-color: var(--color-warning-background-active);
    }

    .muted {
      background-color: var(--color-warning-item-disabled);
    }
  }

  &.accent--danger {
    background-color: var(--color-danger-background-selected);

    .icon {
      color: var(--color-danger-txt-hover);
      background-color: var(--color-danger-background-selected);
    }

    .icon:is(:hover, :focus-visible) {
      background-color: var(--color-danger-background-hover);
    }

    .icon:active {
      background-color: var(--color-danger-background-active);
    }

    &.muted {
      background-color: var(--color-danger-item-disabled);
    }
  }
}
</style>
