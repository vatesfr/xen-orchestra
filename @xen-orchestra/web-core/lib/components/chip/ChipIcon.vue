<template>
  <UiIcon :class="{ disabled }" :color :icon class="chip-icon" fixed-width />
</template>

<script lang="ts" setup>
import UiIcon from '@core/components/icon/UiIcon.vue'
import type { Color } from '@core/types/color.type'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'

defineProps<{
  color: Color
  icon?: IconDefinition
  disabled?: boolean
}>()
</script>

<style lang="postcss" scoped>
.chip-icon {
  color: var(--color-neutral-txt-secondary);

  &.disabled {
    color: var(--color-normal-txt-item);

    &.info {
      color: var(--color-neutral-txt-secondary);
    }
  }
}
</style>
