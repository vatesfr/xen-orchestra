<template>
  <ButtonIcon :color :disabled :icon="faCircleXmark" class="chip-remove-icon" size="small" />
</template>

<script lang="ts" setup>
import ButtonIcon from '@core/components/button/ButtonIcon.vue'
import type { Color } from '@core/types/color.type'
import { faCircleXmark } from '@fortawesome/free-solid-svg-icons'

defineProps<{
  color: Color
  disabled?: boolean
}>()
</script>

<style lang="postcss" scoped>
.chip-remove-icon {
  &.disabled {
    color: var(--color-grey-600);

    &.info {
      color: var(--color-grey-400);
    }
  }
}
</style>
