<template>
  <ButtonIcon :color :icon="faXmark" class="chip-remove-icon" size="small" />
</template>

<script lang="ts" setup>
import ButtonIcon from '@core/components/button/ButtonIcon.vue'
import type { Color } from '@core/types/color.type'
import { faXmark } from '@fortawesome/free-solid-svg-icons'

defineProps<{
  color: Color
}>()
</script>
