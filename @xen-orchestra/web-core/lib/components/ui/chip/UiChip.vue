<!-- v4 -->
<template>
  <span :class="classNames" class="ui-chip typo-body-regular-small" @click="emit('edit')">
    <ChipIcon :disabled :icon />
    <span class="content text-ellipsis">
      <slot />
    </span>
    <ChipRemoveIcon v-if="!disabled" :accent @click.stop="emit('remove')" />
  </span>
</template>

<script lang="ts" setup>
import ChipIcon from '@core/components/ui/chip/ChipIcon.vue'
import ChipRemoveIcon from '@core/components/ui/chip/ChipRemoveIcon.vue'
import { toVariants } from '@core/utils/to-variants.util'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { computed } from 'vue'

export type ChipAccent = 'info' | 'success' | 'warning' | 'danger'

const props = defineProps<{
  accent: ChipAccent
  icon?: IconDefinition
  disabled?: boolean
}>()

const emit = defineEmits<{
  edit: []
  remove: []
}>()

defineSlots<{
  default(): any
}>()

const classNames = computed(() => {
  return [
    toVariants({
      accent: props.accent,
      muted: props.disabled,
    }),
  ]
})
</script>

<style lang="postcss" scoped>
.ui-chip {
  display: flex;
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

  &.muted {
    color: var(--color-neutral-txt-secondary);
    pointer-events: none;
  }

  .content {
    line-height: 1.6rem;
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
