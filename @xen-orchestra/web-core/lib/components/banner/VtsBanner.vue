<template>
  <div :class="className" class="vts-banner">
    <slot />
    <div v-if="slots.addons">
      <slot name="addons" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { toVariants } from '@core/utils/to-variants.util.ts'
import { computed } from 'vue'

export type BannerAccent = 'brand' | 'warning' | 'danger'

const { accent } = defineProps<{
  accent: BannerAccent
}>()

const slots = defineSlots<{
  default(): any
  addons?(): any
}>()

const className = computed(() => toVariants({ accent }))
</script>

<style scoped lang="postcss">
.vts-banner {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.6rem;
  padding: 0.8rem 1.6rem;
  border-block-end: 0.1rem solid var(--color-neutral-border);

  /* ACCENT */
  &.accent--brand {
    background-color: var(--color-brand-background-selected);
  }

  &.accent--warning {
    background-color: var(--color-warning-background-selected);
  }

  &.accent--danger {
    background-color: var(--color-danger-background-selected);
  }
}
</style>
