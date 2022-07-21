<template>
  <button
    :class="`color-${buttonColor}`"
    :disabled="isBusy || isDisabled"
    :type="type || 'button'"
    class="ui-button"
  >
    <FontAwesomeIcon v-if="isBusy" :icon="faSpinner" spin />
    <FontAwesomeIcon v-else-if="iconLeft" :icon="iconLeft" />
    <slot />
  </button>
</template>

<script lang="ts" setup>
import { computed, inject, unref } from "vue";
import type { IconDefinition } from "@fortawesome/fontawesome-common-types";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

const props = defineProps<{
  type?: "button" | "reset" | "submit";
  busy?: boolean;
  disabled?: boolean;
  iconLeft?: IconDefinition;
  color?: "default" | "action";
}>();

const isGroupBusy = inject("isButtonGroupBusy", false);
const isBusy = computed(() => props.busy || unref(isGroupBusy));

const isGroupDisabled = inject("isButtonGroupDisabled", false);
const isDisabled = computed(() => props.disabled || unref(isGroupDisabled));

const buttonGroupColor = inject("buttonGroupColor", "default");
const buttonColor = computed(() => props.color || unref(buttonGroupColor));
</script>

<style scoped>
.ui-button {
  font-size: 1.6rem;
  font-weight: 400;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 3.8rem;
  margin: 0;
  padding: 0 1rem;
  color: var(--color-blue-scale-500);
  border: none;
  border-radius: 0.8rem;
  background-color: var(--color-extra-blue-base);
  gap: 1rem;

  &:not([disabled]) {
    cursor: pointer;
  }

  &.color-action {
    color: var(--color-grayscale-200);
    background-color: var(--color-white);

    &:not([disabled]):hover {
      background-color: var(--background-color-secondary);
    }
  }

  &[disabled] {
    opacity: 0.5;
  }
}
</style>
