<template>
  <div class="ui-card" :class="{ error: color === 'error' }">
    <slot />
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  color?: "error";
}>();
</script>

<style lang="postcss" scoped>
.ui-card {
  height: fit-content;
  padding: 2.1rem;
  border-radius: 0.8rem;
  background-color: var(--background-color-primary);
  box-shadow: var(--shadow-200);
}

.error {
  background-color: var(--background-color-red-vates);
}
</style>
