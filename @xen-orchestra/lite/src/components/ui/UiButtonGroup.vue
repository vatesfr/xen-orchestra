<template>
  <div :class="{ merge }" class="ui-button-group">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import type { Color, SlotDefinition } from "@/types";
import {
  IK_BUTTON_GROUP_BUSY,
  IK_BUTTON_GROUP_COLOR,
  IK_BUTTON_GROUP_DISABLED,
  IK_BUTTON_GROUP_OUTLINED,
  IK_BUTTON_GROUP_TRANSPARENT,
} from "@/types/injection-keys";
import { computed, provide } from "vue";

defineSlots<{
  default: SlotDefinition;
}>();
const props = defineProps<{
  busy?: boolean;
  disabled?: boolean;
  color?: Color;
  outlined?: boolean;
  transparent?: boolean;
  merge?: boolean;
}>();
provide(
  IK_BUTTON_GROUP_BUSY,
  computed(() => props.busy ?? false)
);
provide(
  IK_BUTTON_GROUP_DISABLED,
  computed(() => props.disabled ?? false)
);
provide(
  IK_BUTTON_GROUP_COLOR,
  computed(() => props.color ?? "info")
);
provide(
  IK_BUTTON_GROUP_OUTLINED,
  computed(() => props.outlined ?? false)
);
provide(
  IK_BUTTON_GROUP_TRANSPARENT,
  computed(() => props.transparent ?? false)
);
</script>

<style lang="postcss" scoped>
.ui-button-group {
  display: flex;
  align-items: center;
  justify-content: left;
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
