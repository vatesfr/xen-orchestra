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
