<!-- v8 -->
<template>
  <span :class="classNames" class="ui-chip typo-body-regular-small">
    <span class="text-ellipsis">
      <slot />
    </span>
    <button v-if="!disabled" class="icon" type="button" @click.stop="emit('remove')">
      <VtsIcon name="action:close-cancel-clear" size="medium" />
    </button>
  </span>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
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
</script>

<style lang="postcss" scoped>
.ui-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 1.2rem;
  border-radius: 10rem;
  color: var(--color-neutral-txt-primary);
  min-height: 2.4rem;
  vertical-align: middle;
  white-space: nowrap;

  &.muted {
    color: var(--color-neutral-txt-secondary);
    pointer-events: none;
  }

  .icon {
    border-radius: 0 10rem 10rem 0;
    padding: 0.4rem;
    margin: -0.4rem -1.2rem -0.4rem 0;
    align-self: stretch;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background-color: transparent;
    border: none;
  }

  .icon:focus-visible {
    outline: 0.2rem solid var(--color-brand-txt-base);
    outline-offset: 0.2rem;
  }
  /* COLOR VARIANTS */
  &.accent--info {
    background-color: var(--color-info-background-selected);

    .icon {
      color: var(--color-info-txt-hover);
    }

    .icon:hover {
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
    }

    .icon:hover {
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
    }

    .icon:hover {
      background-color: var(--color-warning-background-hover);
    }

    .icon:active {
      background-color: var(--color-warning-background-active);
    }

    &.muted {
      background-color: var(--color-warning-item-disabled);
    }
  }

  &.accent--danger {
    background-color: var(--color-danger-background-selected);

    .icon {
      color: var(--color-danger-txt-hover);
    }

    .icon:hover {
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
