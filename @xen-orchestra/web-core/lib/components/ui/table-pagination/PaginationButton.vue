<template>
  <UiButtonIcon :disabled accent="brand" class="pagination-button" size="medium" :icon />
</template>

<script setup lang="ts">
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'

defineProps<{
  disabled: boolean
  icon: IconDefinition
}>()
</script>

<style scoped lang="postcss">
.pagination-button.accent--brand {
  border: 0.1rem solid var(--color-neutral-border);
  font-size: 1rem;
  /* Override UiButtonIcon size to match DS */
  width: 3rem;
  height: 3rem;

  &:hover {
    border-color: var(--color-brand-item-hover);
  }

  &:active {
    border-color: var(--color-brand-item-active);
  }

  &:disabled {
    background-color: var(--color-neutral-background-disabled);
    border-color: transparent;
  }
}
</style>
