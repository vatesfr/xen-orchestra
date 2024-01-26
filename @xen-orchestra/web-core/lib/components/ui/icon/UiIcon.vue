<template>
  <UiSpinner v-if="busy" class="ui-icon" />
  <FontAwesomeIcon v-else-if="icon !== undefined" :fixed-width="fixedWidth" :icon="icon" class="ui-icon" />
</template>

<script lang="ts" setup>
import UiSpinner from '@core/components/ui/UiSpinner.vue'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

defineProps<{
  busy?: boolean
  icon?: IconDefinition
  fixedWidth?: boolean
}>()
</script>
