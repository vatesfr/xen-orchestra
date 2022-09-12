<template>
  <div class="ui-button-group">
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
  justify-content: left;
  align-items: center;
  gap: 1rem;
}
</style>
