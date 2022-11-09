<template>
  <div class="ui-card" :class="{ error: props.color === 'error' }">
    <slot />
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  color?: "error";
}>();
</script>

<style lang="postcss" scoped>
.ui-card {
  height: fit-content;
  padding: 2.1rem;
  border-radius: 0.8rem;
  box-shadow: var(--shadow-200);
}

.error {
  background-color: var(--background-color-red-vates);
}
</style>
