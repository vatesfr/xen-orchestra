<template>
  <li :class="{ horizontal }" class="ui-menu-separator" />
</template>

<script lang="ts" setup>
import { inject } from "vue";

const horizontal = inject("isParentMenuHorizontal", false);
</script>

<style lang="postcss" scoped>
.ui-menu-separator {
  &.horizontal {
    margin: 0 0.5rem;
    border-right: 1px solid var(--color-blue-scale-400);
  }

  &:not(.horizontal) {
    border-bottom: 1px solid var(--color-blue-scale-400);
  }
}
</style>
