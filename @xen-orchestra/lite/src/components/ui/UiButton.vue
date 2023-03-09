<template>
  <button
    :class="className"
    :disabled="isBusy || isDisabled"
    :type="type || 'button'"
    class="ui-button"
  >
    <UiSpinner v-if="isBusy" />
    <template v-else>
      <UiIcon :icon="icon" class="icon" />
      <slot />
    </template>
  </button>
</template>

<script lang="ts" setup>
import UiSpinner from "@/components/ui/UiSpinner.vue";
import { computed, inject, unref } from "vue";
import type { Color } from "@/types";
import type { IconDefinition } from "@fortawesome/fontawesome-common-types";
import UiIcon from "@/components/ui/icon/UiIcon.vue";

const props = withDefaults(
  defineProps<{
    type?: "button" | "reset" | "submit";
    busy?: boolean;
    disabled?: boolean;
    icon?: IconDefinition;
    color?: Color;
    outlined?: boolean;
    transparent?: boolean;
    active?: boolean;
  }>(),
  {
    busy: undefined,
    disabled: undefined,
    outlined: undefined,
    transparent: undefined,
  }
);

const isGroupBusy = inject("isButtonGroupBusy", false);
const isBusy = computed(() => props.busy ?? unref(isGroupBusy));

const isGroupDisabled = inject("isButtonGroupDisabled", false);
const isDisabled = computed(() => props.disabled ?? unref(isGroupDisabled));

const isGroupOutlined = inject("isButtonGroupOutlined", false);
const isGroupTransparent = inject("isButtonGroupTransparent", false);

const buttonGroupColor = inject("buttonGroupColor", "info");
const buttonColor = computed(() => props.color ?? unref(buttonGroupColor));

const className = computed(() => {
  return [
    `color-${buttonColor.value}`,
    {
      busy: isBusy.value,
      active: props.active,
      disabled: isDisabled.value,
      outlined: props.outlined ?? unref(isGroupOutlined),
      transparent: props.transparent ?? unref(isGroupTransparent),
    },
  ];
});
</script>

<style lang="postcss" scoped>
.ui-button {
  font-size: 1.6rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.5em;
  padding: 0 0.75em;
  cursor: pointer;
  vertical-align: middle;
  color: var(--button-color);
  border: 1px solid var(--button-border-color);
  border-radius: 0.5em;
  background-color: var(--button-background-color);
  gap: 0.75em;

  &:not(.transparent) {
    box-shadow: var(--shadow-100);
  }

  &.color-info {
    --button-accent-color: var(--color-extra-blue-base);
    --button-accent-color-hover: var(--color-extra-blue-d20);
    --button-accent-color-active: var(--color-extra-blue-d40);
  }

  &.color-success {
    --button-accent-color: var(--color-green-infra-base);
    --button-accent-color-hover: var(--color-green-infra-d20);
    --button-accent-color-active: var(--color-green-infra-d40);
  }

  &.color-warning {
    --button-accent-color: var(--color-orange-world-base);
    --button-accent-color-hover: var(--color-orange-world-d20);
    --button-accent-color-active: var(--color-orange-world-d40);
  }

  &.color-error {
    --button-accent-color: var(--color-red-vates-base);
    --button-accent-color-hover: var(--color-red-vates-d20);
    --button-accent-color-active: var(--color-red-vates-d40);
  }

  &:hover {
    --button-accent-color: var(--button-accent-color-hover);
  }

  &:active,
  &.active,
  &.busy {
    --button-accent-color: var(--button-accent-color-active);
  }

  --button-color: var(--color-blue-scale-500);
  --button-border-color: transparent;
  --button-background-color: var(--button-accent-color);

  &.outlined {
    --button-color: var(--button-accent-color);
    --button-border-color: var(--button-accent-color);
    --button-background-color: var(--background-color-primary);
  }

  &.transparent {
    --button-color: var(--button-accent-color);
    --button-border-color: transparent;
    --button-background-color: transparent;
  }

  &.busy {
    cursor: not-allowed;
  }

  &.disabled {
    cursor: not-allowed;
    --button-color: var(--color-blue-scale-400);
    --button-border-color: transparent;
    --button-background-color: var(--background-color-secondary);
  }
}

.icon {
  font-size: 0.8em;
}

.loader {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5em;
  height: 1.5em;
  animation: spin 1s infinite linear;
  border-radius: 0.75em;

  background: conic-gradient(
    from 90deg at 50% 50%,
    rgba(255, 255, 255, 0) 0deg,
    rgba(255, 255, 255, 0) 0.04deg,
    var(--button-color) 360deg
  );

  &::after {
    width: 1.2em;
    height: 1.2em;
    content: "";
    border-radius: 0.6em;
    background-color: var(--button-background-color);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
