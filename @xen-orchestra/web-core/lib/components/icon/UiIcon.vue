<template>
  <UiSpinner v-if="busy" class="ui-icon" />
  <FontAwesomeIcon
    v-else-if="icon !== undefined"
    :class="color"
    :fixed-width="fixedWidth"
    :icon="icon"
    class="ui-icon"
  />
</template>

<script lang="ts" setup>
import UiSpinner from '@core/components/UiSpinner.vue'
import type { BaseColor } from '@core/types/color.type'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

defineProps<{
  busy?: boolean
  icon?: IconDefinition
  fixedWidth?: boolean
  color?: BaseColor
}>()
</script>

<style lang="postcss" scoped>
.ui-icon {
  &.info {
    color: var(--color-purple-base);
  }

  &.success {
    color: var(--color-green-base);
  }

  &.warning {
    color: var(--color-orange-base);
  }

  &.error {
    color: var(--color-red-base);
  }
}
</style>
