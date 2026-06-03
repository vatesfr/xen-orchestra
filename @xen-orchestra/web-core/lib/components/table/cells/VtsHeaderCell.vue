<template>
  <UiColumnHeader class="vts-header-cell">
    <div class="cell-content">
      <slot />
    </div>
  </UiColumnHeader>
</template>

<script lang="ts" setup>
import UiColumnHeader from '@core/components/ui/column-header/UiColumnHeader.vue'
</script>

<style lang="postcss" scoped>
.vts-header-cell {
  max-width: 30rem;

  .cell-content {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    white-space: nowrap;
  }
}
</style>
