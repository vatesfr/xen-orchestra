<template>
  <button
    :class="[
      `color-${buttonColor}`,
      { busy: isBusy, disabled: isDisabled, 'has-icon': icon !== undefined },
    ]"
    :disabled="isBusy || isDisabled"
    :type="type || 'button'"
    class="ui-button"
  >
    <FontAwesomeIcon v-if="isBusy" :icon="faSpinner" class="icon" spin />
    <template v-else>
      <FontAwesomeIcon v-if="icon" :icon="icon" class="icon" />
      <slot />
    </template>
  </button>
</template>

<script lang="ts" setup>
import { computed, inject, unref } from "vue";
import type { IconDefinition } from "@fortawesome/fontawesome-common-types";
import { faSpinner } from "@fortawesome/pro-regular-svg-icons";

const props = defineProps<{
  type?: "button" | "reset" | "submit";
  busy?: boolean;
  disabled?: boolean;
  icon?: IconDefinition;
  color?: "primary" | "secondary";
}>();

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
  min-width: 10rem;
  height: 5rem;
  padding: 0 1.5rem;
  border: none;
  border-radius: 0.8rem;
  box-shadow: var(--shadow-100);
  gap: 1.5rem;

  &.has-icon {
    min-width: 13rem;
  }

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
      &.busy {
        color: var(--color-extra-blue-d40);
        border-color: var(--color-extra-blue-d40);
      }
    }
  }
}

.icon {
  font-size: 1.6rem;
}
</style>
