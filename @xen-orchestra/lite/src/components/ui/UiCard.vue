<template>
  <div :class="classProp" class="ui-card">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { usePropagatedColor } from "@/composables/propagated-color.composable";
import type { Color } from "@/types";
import { computed } from "vue";

const props = defineProps<{
  color?: Color;
}>();

const { name: propagatedColor, bgClass } = usePropagatedColor(
  () => props.color
);

// We don't want to inherit "info" color
const classProp = computed(() => {
  if (props.color === undefined && propagatedColor.value === "info") {
    return "bg-primary";
  }

  return bgClass.value;
});
</script>

<style lang="postcss" scoped>
.ui-card {
  padding: 2.1rem;
  border-radius: 0.8rem;
  box-shadow: var(--shadow-200);
}

.bg-primary {
  background-color: var(--background-color-primary);
}
</style>
