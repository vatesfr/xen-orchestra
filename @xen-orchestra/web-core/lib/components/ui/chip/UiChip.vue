<!-- v7 -->
<template>
  <span :class="classNames" class="ui-chip typo-body-regular-small" @click="emit('edit')">
    <span class="content text-ellipsis">
      <slot />
    </span>
    <UiButtonIcon accent="brand" icon="action:close-cancel-clear" size="small" :disabled @click.stop="emit('remove')" />
  </span>
</template>

<script lang="ts" setup>
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { toVariants } from '@core/utils/to-variants.util'
import { computed } from 'vue'

export type ChipAccent = 'info' | 'success' | 'warning' | 'danger'

const { accent, disabled } = defineProps<{
  accent: ChipAccent
  disabled?: boolean
}>()

const emit = defineEmits<{
  edit: []
  remove: []
}>()

defineSlots<{
  default(): any
}>()

const classNames = computed(() => [
  toVariants({
    accent,
    muted: disabled,
  }),
])
</script>

<style lang="postcss" scoped>
.ui-chip {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.4rem 0.8rem;
  border-radius: 10rem;
  color: var(--color-neutral-txt-primary);
  cursor: pointer;
  min-height: 2.4rem;
  vertical-align: middle;
  white-space: nowrap;
  min-width: 0;

  .content {
    display: flex;
    align-items: center;
    line-height: 1.6rem;
    height: 2.24rem;
  }

  .ui-button-icon {
    border-radius: calc(10rem - 0.8rem);
  }

  .ui-button-icon:focus-visible {
    outline: none;
  }

  &:focus-visible {
    outline: none;
  }

  &::after {
    content: '';
    position: absolute;
    inset: -0.4rem;
    border: 0.2rem solid transparent;
    pointer-events: none;
  }

  &:focus-visible::after,
  &:has(.ui-button-icon:focus-visible)::after {
    border-color: var(--color-brand-txt-base);
  }

  &.muted {
    color: var(--color-neutral-txt-secondary);
    cursor: not-allowed;
    pointer-events: none;
  }

  :deep(.icon-path) {
    color: var(--chip-icon-color);
  }

  /* COLOR VARIANTS */

  &.accent--info {
    --chip-icon-color: var(--color-info-txt-base);
    background-color: var(--color-info-background-selected);

    &:hover {
      background-color: var(--color-info-background-hover);
    }

    &:active {
      background-color: var(--color-info-background-active);
    }

    &.muted {
      background-color: var(--color-info-item-disabled);
    }
  }

  &.accent--success {
    --chip-icon-color: var(--color-success-txt-base);
    background-color: var(--color-success-background-selected);

    &:hover {
      background-color: var(--color-success-background-hover);
    }

    &:active {
      background-color: var(--color-success-background-active);
    }

    &.muted {
      background-color: var(--color-success-item-disabled);
    }
  }

  &.accent--warning {
    --chip-icon-color: var(--color-warning-txt-base);
    background-color: var(--color-warning-background-selected);

    &:hover {
      background-color: var(--color-warning-background-hover);
    }

    &:active {
      background-color: var(--color-warning-background-active);
    }

    &.muted {
      background-color: var(--color-warning-item-disabled);
    }
  }

  &.accent--danger {
    --chip-icon-color: var(--color-danger-txt-base);
    background-color: var(--color-danger-background-selected);

    &:hover {
      background-color: var(--color-danger-background-hover);
    }

    &:active {
      background-color: var(--color-danger-background-active);
    }

    &.muted {
      background-color: var(--color-danger-item-disabled);
    }
  }
}
</style>
