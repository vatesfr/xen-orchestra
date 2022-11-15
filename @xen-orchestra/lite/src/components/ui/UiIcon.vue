<template>
  <FontAwesomeIcon
    v-if="icon !== undefined"
    :fixed-width="fixedWidth"
    :icon="icon"
    :spin="busy"
    class="ui-icon"
  />
</template>

<script lang="ts" setup>
import { computed } from "vue";
import type { IconDefinition } from "@fortawesome/fontawesome-common-types";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

const props = withDefaults(
  defineProps<{
    busy?: boolean;
    icon?: IconDefinition;
    fixedWidth?: boolean;
  }>(),
  { fixedWidth: true }
);

const icon = computed(() => (props.busy ? faSpinner : props.icon));
</script>

<style lang="postcss" scoped></style>
