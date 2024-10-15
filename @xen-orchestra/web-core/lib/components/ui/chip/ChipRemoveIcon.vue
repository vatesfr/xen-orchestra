<template>
  <VtsButtonIcon :accent :icon="faXmark" size="small" />
</template>

<script lang="ts" setup>
import VtsButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import type { ChipAccent } from '@core/components/ui/chip/UiChip.vue'
import { faXmark } from '@fortawesome/free-solid-svg-icons'

defineProps<{
  accent: ChipAccent
}>()
</script>
