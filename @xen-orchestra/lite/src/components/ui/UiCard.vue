<template>
  <div :class="classProp" class="ui-card">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { useColorContext } from "@/composables/color-context.composable";
import type { Color } from "@/types";
import { computed } from "vue";

const props = defineProps<{
  color?: Color;
}>();

const { name: contextColor, backgroundClass } = useColorContext(
  () => props.color
);

// We don't want to inherit "info" color
const classProp = computed(() => {
  if (props.color === undefined && contextColor.value === "info") {
    return "bg-primary";
  }

  return backgroundClass.value;
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
