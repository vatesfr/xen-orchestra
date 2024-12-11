<template>
  <UiButtonIcon :disabled accent="info" class="ui-pagination-button" size="small" :icon />
</template>

<script setup lang="ts">
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'

const { disabled, icon } = defineProps<{
  disabled: boolean
  icon: IconDefinition
}>()
</script>

<style scoped lang="postcss">
.ui-pagination-button.accent--info {
  background-color: var(--color-neutral-background-primary);
  border: 0.1rem solid var(--color-neutral-border);
  font-size: 1rem;

  &:hover {
    border-color: var(--color-info-item-hover);
    background-color: var(--color-info-background-hover);
  }

  &:active {
    border-color: var(--color-info-item-active);
    background-color: var(--color-info-background-active);
  }

  &:disabled {
    background-color: var(--color-neutral-background-disabled);
    border-color: transparent;

    &:hover,
    &:active {
      background-color: var(--color-neutral-background-disabled);
      border-color: transparent;
    }
  }
}
</style>
