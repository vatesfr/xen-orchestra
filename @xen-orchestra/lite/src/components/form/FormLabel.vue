<template>
  <label class="form-label" :class="{ disabled }">
    <slot />
  </label>
</template>

<script lang="ts" setup>
import { computed, provide } from "vue";

const props = defineProps<{
  disabled?: boolean;
}>();

provide("hasLabel", true);
provide(
  "isLabelDisabled",
  computed(() => props.disabled)
);
</script>

<style lang="postcss" scoped>
.form-label {
  display: inline-flex;
  font-size: 1.6rem;
  align-items: center;
  gap: 1rem;

  &.disabled {
    color: var(--color-blue-scale-300);
  }
}
</style>
