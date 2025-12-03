<template>
  <UiButtonIcon :disabled accent="brand" class="pagination-button" size="small" :icon />
</template>

<script setup lang="ts">
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import type { IconName } from '@core/icons'

defineProps<{
  disabled: boolean
  icon: IconName
}>()
</script>
