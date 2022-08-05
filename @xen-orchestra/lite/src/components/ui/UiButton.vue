<template>
  <button
    :class="[
      `color-${buttonColor}`,
      { busy: isBusy, disabled: isDisabled, active },
    ]"
    :disabled="isBusy || isDisabled"
    :type="type || 'button'"
    class="ui-button"
  >
    <UiIcon :busy="isBusy" :icon="icon" class="icon" />
    <slot v-if="!isBusy" />
  </button>
</template>

<script lang="ts" setup>
import { computed, inject, unref } from "vue";
import type { IconDefinition } from "@fortawesome/fontawesome-common-types";
import UiIcon from "@/components/ui/UiIcon.vue";

const props = withDefaults(
  defineProps<{
    type?: "button" | "reset" | "submit";
    busy?: boolean;
    disabled?: boolean;
    icon?: IconDefinition;
    color?: "primary" | "secondary";
    active?: boolean;
  }>(),
  { busy: undefined, disabled: undefined }
);

const isGroupBusy = inject("isButtonGroupBusy", false);
const isBusy = computed(() => props.busy ?? unref(isGroupBusy));

const isGroupDisabled = inject("isButtonGroupDisabled", false);
const isDisabled = computed(() => props.disabled ?? unref(isGroupDisabled));

const buttonGroupColor = inject("buttonGroupColor", "primary");
const buttonColor = computed(() => props.color ?? unref(buttonGroupColor));
</script>

<style lang="postcss" scoped>
.ui-button {
  font-size: 2rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 5em;
  min-height: 2.5em;
  padding: 0 0.75em;
  vertical-align: middle;
  border: none;
  border-radius: 0.4em;
  box-shadow: var(--shadow-100);
  gap: 0.75em;

  &.disabled {
    color: var(--color-blue-scale-400);
    background-color: var(--background-color-secondary);
  }

  &:not(.disabled) {
    &.color-primary {
      color: var(--color-blue-scale-500);
      background-color: var(--color-extra-blue-base);

      &:hover {
        background-color: var(--color-extra-blue-d20);
      }

      &:active,
      &.active,
      &.busy {
        background-color: var(--color-extra-blue-d40);
      }
    }

    &.color-secondary {
      color: var(--color-extra-blue-base);
      border: 1px solid var(--color-extra-blue-base);
      background-color: var(--color-blue-scale-500);

      &:hover {
        color: var(--color-extra-blue-d20);
        border-color: var(--color-extra-blue-d20);
      }

      &:active,
      &.active,
      &.busy {
        color: var(--color-extra-blue-d40);
        border-color: var(--color-extra-blue-d40);
      }
    }
  }
}

.icon {
  font-size: 0.8em;
}
</style>
