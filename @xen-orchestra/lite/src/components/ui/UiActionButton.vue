<template>
  <button
    :class="{
      busy: isBusy,
      disabled: isDisabled,
      active,
      'has-icon': icon !== undefined,
    }"
    :disabled="isBusy || isDisabled"
    class="ui-action-button"
    type="button"
  >
    <UiIcon :busy="isBusy" :icon="icon" />
    <slot />
  </button>
</template>

<script lang="ts" setup>
import UiIcon from "@/components/ui/icon/UiIcon.vue";
import type { SlotDefinition } from "@/types";
import {
  IK_BUTTON_GROUP_BUSY,
  IK_BUTTON_GROUP_DISABLED,
} from "@/types/injection-keys";
import type { IconDefinition } from "@fortawesome/fontawesome-common-types";
import { computed, inject } from "vue";

defineSlots<{
  default: SlotDefinition;
}>();

const props = withDefaults(
  defineProps<{
    busy?: boolean;
    disabled?: boolean;
    icon?: IconDefinition;
    active?: boolean;
  }>(),
  { busy: undefined, disabled: undefined }
);

const isGroupBusy = inject(
  IK_BUTTON_GROUP_BUSY,
  computed(() => false)
);
const isBusy = computed(() => props.busy ?? isGroupBusy.value);

const isGroupDisabled = inject(
  IK_BUTTON_GROUP_DISABLED,
  computed(() => false)
);
const isDisabled = computed(() => props.disabled ?? isGroupDisabled.value);
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
