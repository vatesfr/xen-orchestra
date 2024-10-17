<template>
  <!-- TODO: replace with correct color typing when available -->
  <VtsIcon :class="{ disabled }" :accent="color === 'normal' ? 'brand' : color" :icon class="chip-icon" fixed-width />
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
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
    color: var(--color-info-txt-item);

    &.info {
      color: var(--color-neutral-txt-secondary);
    }
  }
}
</style>
