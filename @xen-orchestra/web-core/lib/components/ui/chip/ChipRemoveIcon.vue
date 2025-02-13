<template>
  <UiButtonIcon :accent="buttonAccent" :icon="faXmark" size="small" />
</template>

<script lang="ts" setup>
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import type { ChipAccent } from '@core/components/ui/chip/UiChip.vue'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const { accent } = defineProps<{
  accent: ChipAccent
}>()

// FIXME: temporary fix for the 'success' accent, since it doesn't exist in the UiButtonIcon component
const buttonAccent = computed(() => (accent === 'info' || accent === 'success' ? 'brand' : accent))
</script>
