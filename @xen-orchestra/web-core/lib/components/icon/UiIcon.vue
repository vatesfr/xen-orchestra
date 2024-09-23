<!-- v1.0 -->
<template>
  <UiSpinner v-if="busy" class="ui-icon" />
  <FontAwesomeIcon v-else-if="icon !== undefined" :class="color" :fixed-width="fixedWidth" :icon class="ui-icon" />
</template>

<script lang="ts" setup>
import UiSpinner from '@core/components/UiSpinner.vue'
import type { IconColor } from '@core/types/color.type'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

defineProps<{
  busy?: boolean
  icon?: IconDefinition
  fixedWidth?: boolean
  color: IconColor
}>()
</script>

<style lang="postcss" scoped>
/* COLOR VARIANTS */
.ui-icon {
  &.current {
    --color: currentColor;
  }

  &.normal {
    --color: var(--color-normal-item-base);
  }

  &.success {
    --color: var(--color-success-item-base);
  }

  &.warning {
    --color: var(--color-warning-item-base);
  }

  &.danger {
    --color: var(--color-danger-item-base);
  }
}

/* IMPLEMENTATION */
.ui-icon {
  color: var(--color);
}
</style>
