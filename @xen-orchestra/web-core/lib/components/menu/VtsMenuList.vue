<!-- v1.0 -->
<template>
  <ul :class="{ horizontal, border }" class="menu-list">
    <slot />
  </ul>
</template>

<script lang="ts" setup>
import { IK_MENU_HORIZONTAL } from '@core/utils/injection-keys.util'
import { computed, provide } from 'vue'

const { horizontal, border } = defineProps<{
  horizontal?: boolean
  border?: boolean
}>()

provide(
  IK_MENU_HORIZONTAL,
  computed(() => horizontal ?? false)
)
</script>

<style lang="postcss" scoped>
.menu-list {
  z-index: 1;
  display: flex;
  flex-direction: column;
  padding: 0.4rem;
  cursor: default;
  color: var(--color-neutral-txt-primary);
  border-radius: 0.4rem;
  background-color: var(--color-neutral-background-primary);
  gap: 0.2rem;

  &.horizontal {
    flex-direction: row;
  }

  &.border {
    border: 0.1rem solid var(--color-neutral-border);
  }
}
</style>
