<template>
  <span class="inline-parts" :class="{ chevron: separator === 'chevron' }">
    <slot />
  </span>
</template>

<script lang="ts" setup>
// Bullets join facts, chevrons a location from the widest place to the narrowest
const { separator = 'bullet' } = defineProps<{
  separator?: 'bullet' | 'chevron'
}>()

defineSlots<{
  default(): any
}>()
</script>

<style lang="postcss" scoped>
.inline-parts {
  /* The separator is decoration: its empty alternative text keeps screen readers from reading it */
  & > :slotted(:not(:first-child))::before {
    content: '•' / '';
    margin-inline: 0.8rem;
  }

  &.chevron > :slotted(:not(:first-child))::before {
    content: '›' / '';
  }
}
</style>
