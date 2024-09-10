<!-- v1.0 -->
<template>
  <li :class="{ horizontal }" class="menu-separator" />
</template>

<script lang="ts" setup>
import { IK_MENU_HORIZONTAL } from '@core/utils/injection-keys.util'
import { computed, inject } from 'vue'

const horizontal = inject(
  IK_MENU_HORIZONTAL,
  computed(() => false)
)
</script>

<style lang="postcss" scoped>
.menu-separator {
  &.horizontal {
    margin: 0 0.5rem;
    border-right: 1px solid var(--color-neutral-border);
  }

  &:not(.horizontal) {
    border-bottom: 1px solid var(--color-neutral-border);
  }
}
</style>
