<template>
  <UiButtonIcon :disabled accent="brand" class="pagination-button" size="small" :icon />
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
  /* Override UiButtonIcon size to match DS */
  font-size: 1.6rem;
  width: 2.4rem;
  height: 2.4rem;
}
</style>
