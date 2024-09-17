<!-- v1.1 -->
<template>
  <span :class="[color, { disabled }]" class="ui-chip typo p3-regular" @click="emit('edit')">
    <ChipIcon :color :disabled :icon />
    <span class="content text-ellipsis">
      <slot />
    </span>
    <ChipRemoveIcon v-if="!disabled" :color @click.stop="emit('remove')" />
  </span>
</template>

<script lang="ts" setup>
import ChipIcon from '@core/components/chip/ChipIcon.vue'
import ChipRemoveIcon from '@core/components/chip/ChipRemoveIcon.vue'
import type { Color } from '@core/types/color.type'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'

withDefaults(
  defineProps<{
    icon?: IconDefinition
    color?: Color
    disabled?: boolean
  }>(),
  { color: 'info' }
)

const emit = defineEmits<{
  edit: []
  remove: []
}>()
</script>

<style lang="postcss" scoped>
/* COLOR VARIANTS */
.ui-chip {
  --color: var(--color-neutral-txt-primary);

  &.disabled {
    --color: var(--color-normal-txt-item);

    &.info {
      --color: var(--color-neutral-txt-secondary);
    }
  }
}

/* BACKGROUND COLOR VARIANTS */
.ui-chip {
  &.info {
    --background-color: var(--color-normal-background-selected);

    &:is(:hover, .hover, :focus-visible) {
      --background-color: var(--color-normal-background-hover);
    }

    &:is(:active, .pressed) {
      --background-color: var(--color-normal-background-active);
    }

    &.disabled {
      --background-color: var(--color-neutral-background-secondary);
    }
  }

  &.success {
    --background-color: var(--color-success-background-selected);

    &:is(:hover, .hover, :focus-visible) {
      --background-color: var(--color-success-background-hover);
    }

    &:is(:active, .pressed) {
      --background-color: var(--color-success-background-active);
    }

    &.disabled {
      --background-color: var(--color-success-item-disabled);
    }
  }

  &.warning {
    --background-color: var(--color-warning-background-selected);

    &:is(:hover, .hover, :focus-visible) {
      --background-color: var(--color-warning-background-hover);
    }

    &:is(:active, .pressed) {
      --background-color: var(--color-warning-background-active);
    }

    &.disabled {
      --background-color: var(--color-warning-item-disabled);
    }
  }

  &:is(.danger, .error) {
    --background-color: var(--color-danger-background-selected);

    &:is(:hover, .hover, :focus-visible) {
      --background-color: var(--color-danger-background-hover);
    }

    &:is(:active, .pressed) {
      --background-color: var(--color-danger-background-active);
    }

    &.disabled {
      --background-color: var(--color-danger-item-disabled);
    }
  }
}

/* IMPLEMENTATION */
.ui-chip {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.4rem 0.8rem;
  border-radius: 10rem;
  color: var(--color);
  background-color: var(--background-color);
  cursor: pointer;
  min-height: 2.4rem;
  vertical-align: middle;
  white-space: nowrap;
  min-width: 0;

  &.disabled {
    pointer-events: none;
  }

  .content {
    line-height: 1.6rem;
  }
}
</style>
