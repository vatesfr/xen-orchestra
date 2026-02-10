<!-- v5 -->
<template>
  <span :class="classNames" class="ui-chip typo-body-regular-small" @click="!disabled && emit('remove')">
    <span class="text-ellipsis">
      <slot />
    </span>
    <VtsIcon v-if="!disabled" name="action:close-cancel-clear" size="small" :color="iconColor" />
  </span>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { useMapper } from '@core/packages/mapper'
import { toVariants } from '@core/utils/to-variants.util'
import { computed } from 'vue'

export type ChipAccent = 'info' | 'success' | 'warning' | 'danger'

const { accent, disabled } = defineProps<{
  accent: ChipAccent
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
  gap: 0.8rem;
  padding: 0.4rem 0.8rem;
  border-radius: 10rem;
  color: var(--color-neutral-txt-primary);
  min-height: 2.4rem;
  vertical-align: middle;
  white-space: nowrap;
  min-width: 0;
  cursor: pointer;

  &.muted {
    background-color: var(--color-info-item-disabled);
    pointer-events: none;
  }

  /* COLOR VARIANTS */

  &.accent--info {
    background-color: var(--color-info-background-selected);

    &:is(:hover, :focus-visible) {
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
    background-color: var(--color-success-background-selected);

    &:is(:hover, :focus-visible) {
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
    background-color: var(--color-warning-background-selected);

    &:is(:hover, :focus-visible) {
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
    background-color: var(--color-danger-background-selected);

    &:is(:hover, :focus-visible) {
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
