<template>
  <div :class="{ merge }" class="ui-button-group">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { usePropagatedColor } from "@/composables/propagated-color.composable";
import { usePropagatedProp } from "@/composables/propagated-prop.composable";
import type { Color } from "@/types";
import {
  IK_PROPAGATED_BUSY,
  IK_BUTTON_GROUP_OUTLINED,
  IK_BUTTON_GROUP_TRANSPARENT,
  IK_PROPAGATED_DISABLED,
} from "@/types/injection-keys";
import { computed, provide } from "vue";

const props = withDefaults(
  defineProps<{
    busy?: boolean;
    disabled?: boolean;
    color?: Color;
    outlined?: boolean;
    transparent?: boolean;
    merge?: boolean;
  }>(),
  { disabled: undefined, busy: undefined }
);
provide(
  IK_BUTTON_GROUP_OUTLINED,
  computed(() => props.outlined ?? false)
);
provide(
  IK_BUTTON_GROUP_TRANSPARENT,
  computed(() => props.transparent ?? false)
);

usePropagatedColor(() => props.color);
usePropagatedProp(IK_PROPAGATED_BUSY, () => props.busy);
usePropagatedProp(IK_PROPAGATED_DISABLED, () => props.disabled);
</script>

<style lang="postcss" scoped>
.ui-button-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;

  &.merge {
    gap: 0;

    :slotted(.ui-button) {
      &:not(:first-child) {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;

        &.outlined {
          border-left: none;
        }
      }

      &:not(:last-child) {
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;

        &.outlined {
          border-right: none;
        }
      }
    }
  }
}
</style>
