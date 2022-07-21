<template>
  <div class="ui-filter-group">
    <slot />
  </div>
</template>

<script lang="ts" setup></script>

<style scoped>
.ui-filter-group {
  display: flex;
  padding: 1rem;
  background-color: var(--background-color-primary);
  gap: 1rem;
}
</style>
