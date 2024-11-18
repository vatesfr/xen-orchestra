<template>
  <VtsIcon :class="{ muted: disabled }" accent="current" :icon class="chip-icon" fixed-width />
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'

defineProps<{
  icon?: IconDefinition
  disabled?: boolean
}>()
</script>

<style lang="postcss" scoped>
.chip-icon {
  &.muted {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
