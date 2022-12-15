<template>
  <div :class="{ merge }" class="ui-button-group">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { computed, provide } from "vue";
import type { Color } from "@/types";

const props = defineProps<{
  busy?: boolean;
  disabled?: boolean;
  color?: Color;
  outlined?: boolean;
  transparent?: boolean;
  merge?: boolean;
}>();
provide(
  "isButtonGroupBusy",
  computed(() => props.busy ?? false)
);
provide(
  "isButtonGroupDisabled",
  computed(() => props.disabled ?? false)
);
provide(
  "buttonGroupColor",
  computed(() => props.color ?? "info")
);
provide(
  "isButtonGroupOutlined",
  computed(() => props.outlined ?? false)
);
provide(
  "isButtonGroupTransparent",
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
