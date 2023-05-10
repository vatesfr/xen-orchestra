<template>
  <div :class="{ vertical }" class="ui-card-group">
    <slot />
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  vertical?: boolean;
}>();
</script>

<style lang="postcss" scoped>
.ui-card-group {
  display: flex;
  gap: 1rem;
  flex-direction: column;
  flex: 1;
}

@media (min-width: 1500px) {
  .ui-card-group:not(.vertical) {
    flex-direction: row;
  }
}
</style>
