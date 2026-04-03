<!-- v7 -->
<template>
  <span id="removeChip" :class="classNames" class="ui-chip typo-body-regular-small" type="button" @click="emit('edit')">
    <span class="content text-ellipsis">
      <slot />
    </span>
    <UiButtonIcon
      :accent="buttonAccent"
      icon="action:close-cancel-clear"
      size="small"
      :icon-color="iconColor"
      :aria-disabled="disabled"
      @click="!disabled && emit('remove')"
    />
  </span>
</template>

<script lang="ts" setup>
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { useMapper } from '@core/packages/mapper'
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

const buttonAccent = computed(() => (accent === 'info' || accent === 'success' ? 'brand' : accent))

const classNames = computed(() => {
  return [
    toVariants({
      accent,
      muted: disabled,
    }),
  ]
})

const iconColor = useMapper(
  () => accent,
  {
    info: 'var(--color-brand-txt-base)',
    success: 'var(--color-success-txt-base)',
    warning: 'var(--color-warning-txt-base)',
    danger: 'var(--color-danger-txt-base)',
  },
  'info'
)
</script>

<style lang="postcss" scoped>
.ui-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  padding: 0.4rem 0.8rem;
  border-radius: 10rem;
  color: var(--color-neutral-txt-primary);
  cursor: pointer;
  min-height: 2.4rem;
  vertical-align: middle;
  white-space: nowrap;
  min-width: 0;
  border: none;

  .content {
    line-height: 1.6rem;
    height: 2.24rem;
    display: flex;
    align-items: center;
  }

  .ui-button-icon {
    border-radius: calc(10rem - 0.8rem);
  }

  .ui-button-icon:focus-visible::before {
    border: none;
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
    box-sizing: content-box;
    border: 0.2rem solid transparent;
    border-radius: 0.2rem;
    pointer-events: none;
  }

  &:focus-visible::after {
    border-color: var(--color-brand-txt-base);
  }

  &:has(.ui-button-icon:focus-visible)::after {
    border-color: var(--color-brand-txt-base);
  }

  &.muted {
    color: var(--color-neutral-txt-secondary);
    background-color: var(--color-info-item-disabled);
    pointer-events: none;
  }

  /* COLOR VARIANTS */

  &.accent--info {
    background-color: var(--color-info-background-selected);

    &.muted {
      background-color: var(--color-info-item-disabled);
    }
  }

  &.accent--success {
    background-color: var(--color-success-background-selected);

    &.muted {
      background-color: var(--color-success-item-disabled);
    }
  }

  &.accent--warning {
    background-color: var(--color-warning-background-selected);

    &.muted {
      background-color: var(--color-warning-item-disabled);
    }
  }

  &.accent--danger {
    background-color: var(--color-danger-background-selected);

    &.muted {
      background-color: var(--color-danger-item-disabled);
    }
  }
}
</style>
