<template>
  <div class="tab-list">
    <slot />
  </div>
</template>

<script lang="ts" setup></script>

<style lang="postcss" scoped>
.tab-list {
  display: flex;
  align-items: stretch;
  height: 5rem;
  border-bottom: 1px solid var(--color-grey-500);
  background-color: var(--background-color-primary);
  max-width: 100%;
  overflow: auto;
}
</style>
