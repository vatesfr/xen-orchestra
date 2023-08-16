<template>
  <button
    :class="{
      busy: isBusy,
      disabled: isDisabled,
      active,
      'has-icon': icon !== undefined,
    }"
    :disabled="isBusy || isDisabled"
    type="button"
    class="ui-action-button"
  >
    <UiIcon :busy="isBusy" :icon="icon" />
    <slot />
  </button>
</template>

<script lang="ts" setup>
import UiIcon from "@/components/ui/icon/UiIcon.vue";
import { usePropagatedProp } from "@/composables/propagated-prop.composable";
import {
  IK_PROPAGATED_BUSY,
  IK_PROPAGATED_DISABLED,
} from "@/types/injection-keys";
import type { IconDefinition } from "@fortawesome/fontawesome-common-types";

const props = withDefaults(
  defineProps<{
    busy?: boolean;
    disabled?: boolean;
    icon?: IconDefinition;
    active?: boolean;
  }>(),
  { busy: undefined, disabled: undefined }
);

const isBusy = usePropagatedProp(IK_PROPAGATED_BUSY, () => props.busy);

const isDisabled = usePropagatedProp(
  IK_PROPAGATED_DISABLED,
  () => props.disabled
);
</script>

<style lang="postcss" scoped>
.ui-action-button {
  font-size: 1.6rem;
  font-weight: 400;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 4.4rem;
  padding: 0 1.5rem;
  border: none;
  border-radius: 0.8rem;
  gap: 1rem;
  background-color: var(--background-color-primary);

  &.disabled {
    color: var(--color-blue-scale-400);
  }

  &:not(.disabled) {
    color: var(--color-blue-scale-200);

    &:hover {
      background-color: var(--background-color-secondary);
    }

    &:active,
    &.active,
    &.busy {
      color: var(--color-extra-blue-base);
      background-color: var(--background-color-extra-blue);
    }
  }
}
</style>
