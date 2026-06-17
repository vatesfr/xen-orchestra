<template>
  <UiColumnHeader class="vts-header-cell">
    <slot />
  </UiColumnHeader>
</template>

<script lang="ts" setup>
import UiColumnHeader from '@core/components/ui/column-header/UiColumnHeader.vue'
</script>

<style lang="postcss" scoped>
.vts-header-cell {
  max-width: 30rem;
}
</style>
