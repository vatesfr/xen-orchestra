<template>
  <label :class="{ disabled }" class="form-label">
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
  font-size: 1.6rem;
  display: inline-flex;
  align-items: center;
  gap: 1rem;

  &.disabled {
    cursor: not-allowed;
    color: var(--color-blue-scale-300);
  }
}
</style>
