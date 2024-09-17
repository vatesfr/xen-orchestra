<!-- v1.0 -->
<template>
  <UiSpinner v-if="busy" class="ui-icon" />
  <FontAwesomeIcon v-else-if="icon !== undefined" :class="color" :fixed-width="fixedWidth" :icon class="ui-icon" />
</template>

<script lang="ts" setup>
import UiSpinner from '@core/components/UiSpinner.vue'
import type { Color } from '@core/types/color.type'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

defineProps<{
  busy?: boolean
  icon?: IconDefinition
  fixedWidth?: boolean
  color?: Color
}>()
</script>

<style lang="postcss" scoped>
/* COLOR VARIANTS */
.ui-icon {
  --color: currentColor;

  &.info {
    --color: var(--color-normal-txt-base);
  }

  &.success {
    --color: var(--color-success-txt-base);
  }

  &.warning {
    --color: var(--color-warning-txt-base);
  }

  &.error {
    --color: var(--color-danger-txt-base);
  }
}

/* IMPLEMENTATION */
.ui-icon {
  color: var(--color);
}
</style>
