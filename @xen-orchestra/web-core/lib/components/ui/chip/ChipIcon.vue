<template>
  <VtsIcon :class="{ muted: disabled }" :name="icon" size="medium" class="chip-icon" />
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import type { IconName } from '@core/icons'

defineProps<{
  icon?: IconName
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
