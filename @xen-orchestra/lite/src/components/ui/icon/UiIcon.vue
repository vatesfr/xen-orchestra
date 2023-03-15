<template>
  <UiSpinner v-if="busy" class="ui-icon" />
  <FontAwesomeIcon
    v-else-if="icon !== undefined"
    :icon="icon"
    class="ui-icon"
    :fixed-width="fixedWidth"
  />
</template>

<script lang="ts" setup>
import UiSpinner from "@/components/ui/UiSpinner.vue";
import type { IconDefinition } from "@fortawesome/fontawesome-common-types";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

withDefaults(
  defineProps<{
    busy?: boolean;
    icon?: IconDefinition;
    fixedWidth?: boolean;
  }>(),
  { fixedWidth: true }
);
</script>

<style lang="postcss" scoped></style>
