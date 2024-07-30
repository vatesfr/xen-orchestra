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
  --color: var(--color-grey-100);

  &.disabled {
    --color: var(--color-grey-600);

    &.info {
      --color: var(--color-grey-300);
    }
  }
}

/* BACKGROUND COLOR VARIANTS */
.ui-chip {
  &.info {
    --background-color: var(--background-color-purple-10);

    &:is(:hover, .hover, :focus-visible) {
      --background-color: var(--background-color-purple-20);
    }

    &:is(:active, .pressed) {
      --background-color: var(--background-color-purple-30);
    }

    &.disabled {
      --background-color: var(--background-color-secondary);
    }
  }

  &.success {
    --background-color: var(--background-color-green-10);

    &:is(:hover, .hover, :focus-visible) {
      --background-color: var(--background-color-green-20);
    }

    &:is(:active, .pressed) {
      --background-color: var(--background-color-green-30);
    }

    &.disabled {
      --background-color: var(--color-green-l60);
    }
  }

  &.warning {
    --background-color: var(--background-color-orange-10);

    &:is(:hover, .hover, :focus-visible) {
      --background-color: var(--background-color-orange-20);
    }

    &:is(:active, .pressed) {
      --background-color: var(--background-color-orange-30);
    }

    &.disabled {
      --background-color: var(--color-orange-l60);
    }
  }

  &:is(.danger, .error) {
    --background-color: var(--background-color-red-10);

    &:is(:hover, .hover, :focus-visible) {
      --background-color: var(--background-color-red-20);
    }

    &:is(:active, .pressed) {
      --background-color: var(--background-color-red-30);
    }

    &.disabled {
      --background-color: var(--color-red-l60);
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
