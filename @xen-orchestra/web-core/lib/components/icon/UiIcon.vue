<template>
  <UiSpinner v-if="busy" :class="color" class="ui-icon" />
  <FontAwesomeIcon v-else-if="icon !== undefined" :class="color" :fixed-width="fixedWidth" :icon class="ui-icon" />
</template>

<script lang="ts" setup>
import UiSpinner from '@core/components/UiSpinner.vue'
import type { Color } from '@core/types/color.type'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

defineProps<{
  color?: Color
  busy?: boolean
  icon?: IconDefinition
  fixedWidth?: boolean
}>()
</script>

<style lang="postcss" scoped>
.ui-icon {
  color: inherit;

  &.info {
    color: var(--color-purple-base);
  }

  &.success {
    color: var(--color-green-base);
  }

  &.warning {
    color: var(--color-orange-base);
  }

  &.error,
  &.danger {
    color: var(--color-red-base);
  }
}
</style>
