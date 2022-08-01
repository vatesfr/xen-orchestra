<template>
  <div class="ui-button-group">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { computed, provide } from "vue";

const props = defineProps<{
  busy?: boolean;
  disabled?: boolean;
  color?: "primary" | "secondary";
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
  computed(() => props.color ?? "primary")
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
