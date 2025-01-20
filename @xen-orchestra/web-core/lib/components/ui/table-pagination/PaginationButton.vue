<template>
  <UiButtonIcon :disabled accent="info" class="pagination-button" size="small" :icon />
</template>

<script setup lang="ts">
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'

const { disabled, icon } = defineProps<{
  icon: IconDefinition
  disabled?: boolean
}>()
</script>

<style scoped lang="postcss">
.pagination-button.accent--info {
  border: 0.1rem solid var(--color-neutral-border);
  font-size: 1rem;

  &:hover {
    border-color: var(--color-info-item-hover);
  }

  &:active {
    border-color: var(--color-info-item-active);
  }

  &:disabled {
    background-color: var(--color-neutral-background-disabled);
    border-color: transparent;
  }
}
</style>
