<template>
  <li :class="{ horizontal }" class="ui-menu-separator" />
</template>

<script lang="ts" setup>
import { IK_MENU_HORIZONTAL } from '@/types/injection-keys'
import { computed, inject } from 'vue'

const horizontal = inject(
  IK_MENU_HORIZONTAL,
  computed(() => false)
)
</script>

<style lang="postcss" scoped>
.ui-menu-separator {
  &.horizontal {
    margin: 0 0.5rem;
    border-right: 1px solid var(--color-grey-500);
  }

  &:not(.horizontal) {
    border-bottom: 1px solid var(--color-grey-500);
  }
}
</style>
