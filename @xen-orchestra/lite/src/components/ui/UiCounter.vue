<template>
  <span :class="color" class="ui-counter">
    <span :class="{ overflow: value > 99 }">
      {{ value }}
    </span>
  </span>
</template>

<script lang="ts" setup>
import type { Color } from "@/types";

defineProps<{
  value: number;
  color?: Color;
}>();
</script>

<style lang="postcss" scoped>
.ui-counter {
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--size);
  height: var(--size);
  color: var(--color-blue-scale-500);
  border-radius: calc(var(--size) / 2);
  background-color: var(--color-blue-scale-300);
  --size: 1.75em;

  .overflow {
    font-size: 0.8em;
  }

  &.info {
    background-color: var(--color-extra-blue-base);
  }

  &.success {
    background-color: var(--color-green-infra-base);
  }

  &.warning {
    background-color: var(--color-orange-world-base);
  }

  &.error {
    background-color: var(--color-red-vates-base);
  }
}
</style>
